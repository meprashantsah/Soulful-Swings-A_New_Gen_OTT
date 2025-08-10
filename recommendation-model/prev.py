import pandas as pd
import numpy as np
import requests
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import Dense, Embedding, Flatten, Dropout, Concatenate, Input
from tensorflow.keras.callbacks import EarlyStopping
import tensorflow as tf
import re 
import time
import sys  # Add this at the top of your script
# Load datasets
titles = pd.read_csv('titles.csv')
credits = pd.read_csv('credits.csv')
# Preprocess datasets
# Parse 'genres' and 'production_countries'
for column in ['genres', 'production_countries']:
    titles[column] = titles[column].apply(lambda x: eval(x) if pd.notna(x) else [])
    titles[column] = titles[column].apply(lambda x: ','.join(x))
# Fill missing values for 'age_certification'
titles['age_certification'] = titles['age_certification'].fillna('Unknown')
# Initialize LabelEncoders
label_encoders = {}
for col in ['type', 'genres', 'production_countries', 'age_certification']:
    le = LabelEncoder()
    titles[col] = le.fit_transform(titles[col])
    label_encoders[col] = le
# Normalize 'runtime'
scaler = StandardScaler()
titles['runtime'] = scaler.fit_transform(titles[['runtime']])
# Select relevant columns
movies = titles[['type', 'genres', 'production_countries', 'runtime', 'age_certification', 'title']]
# Load the trained model
model = load_model('movie_recommender_model.h5')
print("Model loaded!")
# Function to recommend movies using the model with decoded output
def recommend_advanced(input_data):
    prediction = model.predict([
        np.array([input_data[0]]), 
        np.array([input_data[1]]), 
        np.array([input_data[2]]), 
        np.array([input_data[3]]), 
        np.array([input_data[4]])
    ])
    top_indices = np.argsort(prediction[0])[-5:][::-1]  # Get top 5 recommendations
    # Retrieve the top movies
    recommendations = movies.iloc[top_indices].copy()
    # Decode categorical columns
    for col in ['type', 'genres', 'production_countries', 'age_certification']:
        if col in label_encoders:  # Decode only if a LabelEncoder exists
            recommendations[col] = recommendations[col].apply(lambda x: label_encoders[col].inverse_transform([x])[0])
    # Inverse transform 'runtime' to its original scale
    recommendations['runtime'] = scaler.inverse_transform(recommendations[['runtime']])
    return recommendations[['title', 'type', 'genres', 'production_countries', 'runtime', 'age_certification']]
# Function to encode user preferences with checks for unseen labels
# Function to encode user preferences with proper handling for runtime
def encode_user_input(preferences, label_encoders, scaler):
    user_input = []
    for col, value in preferences.items():
        if col == 'runtime':
            # Scale runtime value
                scaled_value = scaler.transform([[value]])[0][0]
                user_input.append(scaled_value)
        else:
            try:
                user_input.append(label_encoders[col].transform([value])[0])
            except ValueError:
                print(f"Warning: '{value}' is an unseen label for {col}. Defaulting to the first label.")
                user_input.append(0)  # Default to the first label if unseen
    return user_input
def transform_preferences(api_data):
    preferences = {
        'type': 'MOVIE',  # Default to MOVIE
        'genres': '',
        'production_countries': '',
        'runtime': 120,  # Default to 120 minutes
        'age_certification': 'PG-13'  # Always set to PG-13
    }
    
    # Ensure there are at least 5 responses
    if len(api_data) >= 5:
       # First response: Type (movie or show)
        first_response = api_data[0]
        keywords = first_response.get('keywords', [])
        # Convert keywords to lowercase for case-insensitive matching
        keywords_lower = [k.lower() for k in keywords]
        
        if '[movie]' in keywords_lower:
            preferences['type'] = 'MOVIE'
        elif '[show]' in keywords_lower:
            preferences['type'] = 'SHOW'
        
        # Third response: Genres
        # Third response: Genres (case-insensitive check)
        third_response = api_data[2]
        keywords = third_response.get('keywords', [])
        # Convert keywords to lowercase and remove brackets, then join them as a comma-separated list
        genres = ', '.join([k.strip('[]').lower() for k in keywords])
        preferences['genres'] = genres
       # Fourth response: Production countries (case-insensitive check)
        fourth_response = api_data[3]
        keywords = fourth_response.get('keywords', [])
        # Convert keywords to lowercase for case-insensitive matching
        keywords_lower = [k.lower() for k in keywords]
        
        if '[hollywood]' in keywords_lower:
            preferences['production_countries'] = 'US'
        elif '[bollywood]' in keywords_lower:
            preferences['production_countries'] = 'IN'
        
        # Fifth response: Runtime
         # Fifth response: Runtime
        fifth_response = api_data[4]
        keywords = fifth_response.get('keywords', [])
        runtime_match = None
        
        # Look for numeric values in the keywords for runtime (in minutes)
        for keyword in keywords:
            runtime_match = re.search(r'(\d+)', keyword)  # Regex to find numbers
            if runtime_match:
                preferences['runtime'] = int(runtime_match.group(1))  # Assign the first number found as runtime
                break  # Exit after finding the first valid number
        
        # If no number is found, fallback to the default runtime (120 minutes)
        if not runtime_match:
            preferences['runtime'] = 120  # Default runtime
            
    # Ensure no leading/trailing spaces and handle empty fields
    preferences['genres'] = preferences['genres'].strip() if preferences['genres'] else 'action'  # Default genre
    preferences['production_countries'] = preferences['production_countries'].strip() if preferences['production_countries'] else 'US'  # Default country
    
    return preferences
# API endpoints
api_url_get = "http://localhost:5000/api/get-responses"  # Replace with your API link
api_url_post = "http://localhost:5000/api/data"  # Replace with your API link
while True:
    try:
        # Fetch preferences dynamically from the API
        response = requests.get(api_url_get)
        response.raise_for_status()  # Raise an exception for HTTP errors
        api_data = response.json()  # Parse JSON response
        if api_data:  # Check if data is not empty
            print("Fetched Preferences:", api_data)
            # Transform preferences
            preferences = transform_preferences(api_data)
            print("Transformed Preferences:", preferences)
            # Encode user preferences
            user_input = encode_user_input(preferences, label_encoders, scaler)
            # Provide recommendations
            recommendations = recommend_advanced(user_input)
            print("Recommendations:")
            print(recommendations)
            # Convert recommendations to JSON-friendly format
            recommendations_json = recommendations.to_dict(orient='records')
            print("Recommendations JSON:", recommendations_json)
            # Send recommendations to the API
            try:
                post_response = requests.post(api_url_post, json=recommendations_json)
                post_response.raise_for_status()  # Raise an exception for HTTP errors
                print("Recommendations sent to API. Response:")
                print(post_response.json())
                sys.exit()
            except requests.exceptions.RequestException as e:
                print(f"Error sending recommendations to API: {e}")
        else:
            print("No data received from API. Waiting for the next attempt...")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching preferences from API: {e}")
    # Wait before the next API call
    time.sleep(5)  # Adjust the interval as needed