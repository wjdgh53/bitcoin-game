#!/usr/bin/env python3
"""
ChromaDB Collections Initialization Script for Bitcoin Trading Game

This script creates the 5 primary ChromaDB collections needed for the game:
1. bitcoin_historical_data: Price history and market indicators
2. user_portfolios: Trading positions and performance  
3. game_achievements: User progress and rewards
4. market_analysis: Technical analysis and predictions
5. educational_content: Trading guides and tutorials
"""

import chromadb
from chromadb.config import Settings
import os
import json

def get_collection_configs():
    """Define collection configurations with metadata"""
    return [
        {
            "name": "bitcoin_historical_data",
            "metadata": {
                "description": "Historical Bitcoin price data, market indicators, and trading volumes for game analysis",
                "data_types": "price,volume,market_cap,technical_indicators,timestamps",
                "usage": "Store and query historical Bitcoin data for game scenarios and backtesting",
                "category": "market_data"
            }
        },
        {
            "name": "user_portfolios",
            "metadata": {
                "description": "User trading positions, portfolio performance, and transaction history",
                "data_types": "user_id,positions,balance,transactions,performance_metrics",
                "usage": "Track user portfolio state and trading activity across game sessions",
                "category": "user_data"
            }
        },
        {
            "name": "game_achievements",
            "metadata": {
                "description": "User achievements, progress tracking, rewards, and milestone completions",
                "data_types": "user_id,achievement_type,completion_date,rewards,progress",
                "usage": "Store and retrieve user progress for gamification and reward systems",
                "category": "gamification"
            }
        },
        {
            "name": "market_analysis",
            "metadata": {
                "description": "Technical analysis results, market predictions, and trading signals",
                "data_types": "analysis_type,predictions,confidence_scores,trading_signals,timeframes",
                "usage": "Store AI-generated market analysis and trading recommendations for the game",
                "category": "analytics"
            }
        },
        {
            "name": "educational_content",
            "metadata": {
                "description": "Trading tutorials, educational materials, tips, and strategy guides",
                "data_types": "content_type,difficulty_level,topics,media_urls,learning_objectives",
                "usage": "Provide educational content to help users learn trading concepts and strategies",
                "category": "education"
            }
        }
    ]

def main():
    print("🎮 Bitcoin Trading Game - ChromaDB Collections Initialization")
    print("=" * 60)
    
    # Initialize ChromaDB client with persistent storage
    chroma_data_path = os.path.join(os.getcwd(), "chroma_data")
    
    print(f"Initializing ChromaDB with persistent storage at: {chroma_data_path}")
    
    try:
        # Create client with persistent storage
        client = chromadb.PersistentClient(path=chroma_data_path)
        print("✓ ChromaDB client initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize ChromaDB client: {e}")
        return False
    
    collection_configs = get_collection_configs()
    created_collections = []
    
    print(f"\nCreating {len(collection_configs)} collections...")
    print("-" * 40)
    
    for config in collection_configs:
        try:
            print(f"\nCollection: {config['name']}")
            print(f"Description: {config['metadata']['description']}")
            print(f"Data types: {config['metadata']['data_types']}")
            print(f"Usage: {config['metadata']['usage']}")
            
            # Try to get existing collection first
            try:
                collection = client.get_collection(name=config['name'])
                print(f"✓ Collection '{config['name']}' already exists")
            except:
                # Collection doesn't exist, create it
                collection = client.create_collection(
                    name=config['name'],
                    metadata=config['metadata']
                )
                print(f"✓ Created collection '{config['name']}'")
            
            created_collections.append(config['name'])
            
        except Exception as e:
            print(f"✗ Failed to create collection '{config['name']}': {e}")
            return False
    
    print(f"\n🎉 Successfully initialized {len(created_collections)} collections!")
    
    # List all collections to verify
    print("\n📋 Verifying collections:")
    print("-" * 25)
    
    try:
        all_collections = client.list_collections()
        
        for i, collection in enumerate(all_collections, 1):
            # Get collection details
            coll = client.get_collection(name=collection.name)
            count = coll.count()
            
            print(f"{i}. {collection.name}")
            print(f"   Documents: {count}")
            print(f"   Metadata: {collection.metadata}")
            print()
        
        print(f"Total collections: {len(all_collections)}")
        
        # Save collection info to JSON file for reference
        collections_info = []
        for collection in all_collections:
            coll = client.get_collection(name=collection.name)
            collections_info.append({
                "name": collection.name,
                "metadata": collection.metadata,
                "document_count": coll.count()
            })
        
        with open("chroma_collections_info.json", "w") as f:
            json.dump(collections_info, f, indent=2, default=str)
        
        print("✓ Collection information saved to 'chroma_collections_info.json'")
        
    except Exception as e:
        print(f"✗ Failed to list collections: {e}")
        return False
    
    print("\n✅ Bitcoin Trading Game ChromaDB setup completed successfully!")
    print("Collections are ready for storing game data with efficient indexing.")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)