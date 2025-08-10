import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Embedding, Flatten, Dropout, Concatenate, Input
from tensorflow.keras.callbacks import EarlyStopping
import tensorflow as tf
# Load datasets
titles = pd.read_csv('../datasets/titles.csv')
credits = pd.read_csv('../datasets/credits.csv')
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
movies = titles[['type', 'genres', 'production_countries', 'runtime', 'age_certification']]
# Define model parameters
embedding_dim = 50
# Input layers
type_input = Input(shape=(1,), name='type')
genres_input = Input(shape=(1,), name='genres')
production_countries_input = Input(shape=(1,), name='production_countries')
runtime_input = Input(shape=(1,), name='runtime')
age_certification_input = Input(shape=(1,), name='age_certification')
# Embedding layers
type_embedding = Embedding(input_dim=len(label_encoders['type'].classes_), output_dim=embedding_dim)(type_input)
genres_embedding = Embedding(input_dim=len(label_encoders['genres'].classes_), output_dim=embedding_dim)(genres_input)
production_countries_embedding = Embedding(input_dim=len(label_encoders['production_countries'].classes_), output_dim=embedding_dim)(production_countries_input)
age_certification_embedding = Embedding(input_dim=len(label_encoders['age_certification'].classes_), output_dim=embedding_dim)(age_certification_input)
# Flatten embeddings
type_flatten = Flatten()(type_embedding)
genres_flatten = Flatten()(genres_embedding)
production_countries_flatten = Flatten()(production_countries_embedding)
age_certification_flatten = Flatten()(age_certification_embedding)
# Combine embeddings and runtime
combined = Concatenate()([
    type_flatten,
    genres_flatten,
    production_countries_flatten,
    age_certification_flatten,
    runtime_input
])
# Dense layers
x = Dense(128, activation='relu')(combined)
x = Dropout(0.2)(x)
x = Dense(64, activation='relu')(x)
x = Dropout(0.2)(x)
output = Dense(len(movies), activation='softmax')(x)
# Compile model
model = Model(inputs=[
    type_input, genres_input, production_countries_input, runtime_input, age_certification_input
], outputs=output)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
# Prepare data for training
X = [
    movies['type'].values,
    movies['genres'].values,
    movies['production_countries'].values,
    movies['runtime'].values,
    movies['age_certification'].values
]
Y = movies.index.values
# Train the model
early_stopping = EarlyStopping(monitor='val_loss', patience=5)
model.fit(X, Y, epochs=30, batch_size=32, validation_split=0.2, callbacks=[early_stopping])
# Save the trained model
model.save('movie_recommender_model.h5')
print("Model training complete and saved!")