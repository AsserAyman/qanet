/*
  # Create prayer logs table

  1. New Tables
    - `prayer_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `start_surah` (text)
      - `start_ayah` (integer)
      - `end_surah` (text)
      - `end_ayah` (integer)
      - `total_ayahs` (integer)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `prayer_logs` table
    - Add policies for authenticated users to:
      - Insert their own logs
      - Read their own logs
*/

CREATE TABLE prayer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date DEFAULT CURRENT_DATE,
  start_surah text NOT NULL,
  start_ayah integer NOT NULL,
  end_surah text NOT NULL,
  end_ayah integer NOT NULL,
  total_ayahs integer NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own logs"
  ON prayer_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own logs"
  ON prayer_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX prayer_logs_user_id_idx ON prayer_logs(user_id);
CREATE INDEX prayer_logs_date_idx ON prayer_logs(date);