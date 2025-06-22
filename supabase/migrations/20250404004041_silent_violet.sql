/*
  # Add status stats function
  
  1. New Functions
    - `get_status_stats`: Returns a table of prayer status counts
      - Returns:
        - `status` (text): The prayer status
        - `count` (bigint): Number of prayers with that status
  
  2. Description
    - Creates a function to aggregate prayer logs by status
    - Used by the history screen to show status distribution
*/

CREATE OR REPLACE FUNCTION get_status_stats()
RETURNS TABLE (status TEXT, count BIGINT)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT status, COUNT(*) AS count
  FROM prayer_logs
  GROUP BY status;
$$;