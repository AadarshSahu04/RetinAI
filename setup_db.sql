-- Run this script to set up the PostgreSQL database
-- Execute: psql -U postgres -f setup_db.sql

-- Create user
CREATE USER druser WITH PASSWORD 'drpassword';

-- Create database
CREATE DATABASE drdetection OWNER druser;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE drdetection TO druser;

-- Connect and set schema privileges
\c drdetection
GRANT ALL ON SCHEMA public TO druser;
