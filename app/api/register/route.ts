import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, contact, gender, birthday, affiliations, promotional } = body;

    // Validate required fields
    if (!name || !email || !contact || !gender || !birthday) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('2xu');
    const collection = db.collection('users');

    // Check if email already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Insert new user
    const result = await collection.insertOne({
      name,
      email,
      contact,
      gender,
      birthday,
      affiliations: affiliations || '',
      promotional: promotional || false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Registration successful',
        id: result.insertedId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration' },
      { status: 500 }
    );
  }
}

