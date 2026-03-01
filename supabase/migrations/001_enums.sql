-- Create custom enum types
CREATE TYPE public.user_role AS ENUM ('user', 'super_admin');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
