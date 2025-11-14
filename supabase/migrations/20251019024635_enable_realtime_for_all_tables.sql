/*
  # Enable Realtime for All Tables

  1. Changes
    - Enable realtime replication for all project-related tables
    - This allows Supabase Realtime to push database changes to connected clients
    
  2. Tables Enabled
    - projects: Project information updates
    - stages: Stage status and data changes
    - deliverables: File uploads and deletions
    - revisions: Revision requests and completions
    - extensions: Extension purchases and status
    - stage_payments: Payment submissions and verifications
    - stage_notes: Messages between freelancer and client
*/

-- Enable realtime for all project tables
DO $$
BEGIN
  -- Add each table to the realtime publication if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE stages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE deliverables;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE revisions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE extensions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE stage_payments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE stage_notes;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
