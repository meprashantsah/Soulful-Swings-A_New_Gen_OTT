import pandas as pd
import ast
import re
import time
import sys
import requests

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

# =============================================================================
# Data Loading and Recommendation Functions
# =============================================================================

def load_data(filepath):
    """
    Load movie/show data from a CSV file, clean the data, and compute a TF-IDF
    representation based on the combined genres and description.
    """
    df = pd.read_csv(filepath)
    
    # Convert string representations of lists into actual lists.
    list_columns = ['genres', 'production_countries']
    for col in list_columns:
        df[col] = df[col].apply(lambda x: ast.literal_eval(x) if pd.notnull(x) else [])
    
    # Filter to include only items with a valid type and essential fields.
    df = df.dropna(subset=['genres', 'production_countries', 'description', 'imdb_score', 'runtime'])
    df = df.drop_duplicates(subset=['id'])
    
    # Combine genres (as text) with description.
    df['combined_text'] = df['genres'].apply(lambda x: ' '.join(x)) + " " + df['description']
    
    # Compute TF-IDF matrix for combined text.
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined_text']).toarray()
    
    # Save each item's TF-IDF vector in a new column.
    df['tfidf_matrix'] = list(tfidf_matrix)
    
    return df, tfidf

def recommend_movies(df, tfidf, user_type, user_genres, user_runtime, user_country, num_results=10):
    """
    Recommend movies or shows based on user preferences:
      - Filter by type (movie or show).
      - Filter by production country and runtime (±30 minutes).
      - Use TF-IDF to compute cosine similarity between user genres and item text.
      - Combine similarity with IMDB score to rank items.
    
    Parameters:
        df (DataFrame): The dataset containing movies/shows.
        tfidf (TfidfVectorizer): The fitted TF-IDF vectorizer.
        user_type (str): The desired type ("MOVIE" or "SHOW").
        user_genres (list): A list of genres from the user's preferences.
        user_runtime (int): The preferred runtime (in minutes).
        user_country (str): The production country preference.
        num_results (int): The number of results to return.
        
    Returns:
        DataFrame: A DataFrame with the top recommended items.
    """
    # Standardize the country and type formats.
    user_country = user_country.upper().strip()
    user_type = user_type.upper().strip()
    
    # Filter items by type.
    filtered = df[df['type'] == user_type]
    
    # Filter by production country and runtime (±30 minutes).
    filtered = filtered[
        (filtered['production_countries'].apply(lambda x: user_country in x)) &
        (filtered['runtime'].between(user_runtime - 30, user_runtime + 30))
    ]
    
    # If not enough items are found, drop the runtime constraint.
    if len(filtered) < num_results:
        filtered = df[df['type'] == user_type]
        filtered = filtered[filtered['production_countries'].apply(lambda x: user_country in x)]
    
    if filtered.empty:
        print("No movies/shows found matching your criteria.")
        return pd.DataFrame()
    
    # Prepare the user input for TF-IDF similarity calculation.
    user_input = ' '.join(user_genres)
    user_tfidf = tfidf.transform([user_input]).toarray()
    
    # Calculate cosine similarity between user input and each item's TF-IDF vector.
    cosine_sim = cosine_similarity(user_tfidf, list(filtered['tfidf_matrix'])).flatten()
    filtered = filtered.copy()
    filtered['similarity_score'] = cosine_sim
    
    # Normalize the similarity and IMDB scores.
    scaler = MinMaxScaler()
    normalized_scores = scaler.fit_transform(filtered[['similarity_score', 'imdb_score']].fillna(0))
    filtered['final_score'] = 0.7 * normalized_scores[:, 0] + 0.3 * normalized_scores[:, 1]
    
    # Return the top N items sorted by the final score.
    filtered = filtered.sort_values(by='final_score', ascending=False)
    return filtered.head(num_results)

# =============================================================================
# API Preference Transformation Function
# =============================================================================

def transform_preferences(api_data):
    """
    Transform API data responses into a preferences dictionary.
    Expects at least five responses.
    """
    preferences = {
        'type': 'MOVIE',  # Default type; can be 'MOVIE' or 'SHOW'
        'genres': '',
        'production_countries': '',
        'runtime': 120,   # Default runtime in minutes
        'age_certification': 'PG-13'
    }
    
    if len(api_data) >= 5:
        # First response: Determine type (movie or show).
        first_response = api_data[0]
        keywords = first_response.get('keywords', [])
        keywords_lower = [k.lower() for k in keywords]
        if '[movie]' in keywords_lower:
            preferences['type'] = 'MOVIE'
        elif '[show]' in keywords_lower:
            preferences['type'] = 'SHOW'
        
        # Third response: Get genres.
        third_response = api_data[2]
        keywords = third_response.get('keywords', [])
        genres = ', '.join([k.strip('[]').lower() for k in keywords])
        preferences['genres'] = genres
        
        # Fourth response: Determine production country.
        fourth_response = api_data[3]
        keywords = fourth_response.get('keywords', [])
        keywords_lower = [k.lower() for k in keywords]
        if '[hollywood]' in keywords_lower:
            preferences['production_countries'] = 'US'
        elif '[bollywood]' in keywords_lower:
            preferences['production_countries'] = 'IN'
        
        # Fifth response: Extract runtime.
        fifth_response = api_data[4]
        keywords = fifth_response.get('keywords', [])
        runtime_match = None
        for keyword in keywords:
            runtime_match = re.search(r'(\d+)', keyword)
            if runtime_match:
                preferences['runtime'] = int(runtime_match.group(1))
                break
        if not runtime_match:
            preferences['runtime'] = 120
    
    # Ensure defaults if empty.
    preferences['genres'] = preferences['genres'].strip() if preferences['genres'] else 'action'
    preferences['production_countries'] = preferences['production_countries'].strip() if preferences['production_countries'] else 'US'
    
    return preferences

# =============================================================================
# Utility Function to Print Recommendations in a Nice Format
# =============================================================================

def print_recommendations(recommendations, user_type):
    """
    Print recommendations in a nicely formatted table including a column that indicates
    if the item is a movie or a show, along with a header reflecting the user's preferred type.
    
    Parameters:
        recommendations (DataFrame): The DataFrame containing recommended items.
        user_type (str): The user's preferred type (e.g., "MOVIE" or "SHOW").
    """
    if recommendations.empty:
        print("No recommendations to display.")
        return

    # Create a title header using the user_type.
    title = f"Recommended {user_type.title()}s"
    print("\n" + title)
    print("=" * len(title))
    
    # Create the table header with an extra "Type" column.
    header = (f"{'Title':^30} | {'Type':^10} | {'Runtime':^8} | "
              f"{'Country':^10} | {'Genres':^20} | {'IMDB Score':^10}")
    separator = "-" * len(header)
    
    # Print the header and a separator.
    print(separator)
    print(header)
    print(separator)
    
    # Iterate through each row in the recommendations DataFrame.
    for _, row in recommendations.iterrows():
        # Truncate the title if it's too long.
        display_title = row['title'] if len(row['title']) <= 30 else row['title'][:27] + "..."
        item_type = row['type']
        runtime = row['runtime']
        # Join production countries and genres lists into comma-separated strings.
        country = ", ".join(row['production_countries'])
        genres = ", ".join(row['genres'])
        imdb = row['imdb_score']
        
        # Print the row data in a formatted manner.
        print(f"{display_title:<30} | {item_type:^10} | {runtime:^8} | {country:^10} | {genres:<20} | {imdb:^10}")
    
    # Print the final separator.
    print(separator)


# =============================================================================
# Main Function with Dummy Data for Testing
# =============================================================================
def main():
    # Load movie/show data from CSV
    filepath = 'titles.csv'  # Replace with your actual file path if needed
    df, tfidf = load_data(filepath)

    # Define API endpoints (adjust these URLs as needed)
    api_url_get = "http://localhost:5000/api/get-responses"  # Fetch user responses
    api_url_post = "http://localhost:5000/api/data"           # Send recommendations
    
    while True:
        try:
            # Fetch user preference data from the API
            response = requests.get(api_url_get, timeout=10)  # Set timeout for responsiveness
            response.raise_for_status()  # Raise error for bad responses
            
            api_data = response.json()
            if api_data:
                print("\nFetched Preferences from API:", api_data)
                
                # Transform API data into a structured preferences dictionary
                preferences = transform_preferences(api_data)
                print("Transformed Preferences:", preferences)
                
                # Extract values to match recommend_movies() parameters
                user_type = preferences['type']
                user_genres = [genre.strip() for genre in preferences['genres'].split(',')]
                user_runtime = preferences['runtime']
                user_country = preferences['production_countries']
                
                # Get recommendations
                recommendations = recommend_movies(df, tfidf, user_type, user_genres, user_runtime, user_country, num_results=10)
                
                if recommendations.empty:
                    print("No recommendations found based on the current preferences.")
                    recommendations_json = []
                else:
                    # Convert recommendations to JSON-friendly format
                    recommendations_json = recommendations[['title', 'type', 'runtime', 'production_countries', 'genres', 'imdb_score']].to_dict(orient='records')
                    print("\nGenerated Recommendations:")
                    for rec in recommendations_json:
                        print(f"Title: {rec['title']}, Type: {rec['type']}, Runtime: {rec['runtime']} min, "
                              f"Country: {', '.join(rec['production_countries'])}, Genres: {', '.join(rec['genres'])}, "
                              f"IMDB Score: {rec['imdb_score']}")
                    
                    print("\nSending recommendations to API...")

                    # Send recommendations to the API
                    post_response = requests.post(api_url_post, json=recommendations_json, timeout=10)
                    post_response.raise_for_status()  # Raise error if POST request fails
                    print("Recommendations successfully sent to API. Response:")
                    print(post_response.json())

                    # Exit loop after successful processing
                    sys.exit()
            
            else:
                print("No data received from API. Waiting for the next attempt...")

        except requests.exceptions.RequestException as e:
            print(f"API request error: {e}")

        # Wait before the next attempt
        time.sleep(5)

if __name__ == "__main__":
    main()
