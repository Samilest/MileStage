/*
  # Add Title and Description to Deliverables

  1. Changes
    - Add `title` column to deliverables table (text, required)
    - Add `description` column to deliverables table (text, optional)
    - Rename `uploaded_at` to `added_at` for consistency with requirements
    - Migrate existing `name` data to `title`

  2. Migration Strategy
    - Add new columns with nullable constraint
    - Copy data from `name` to `title`
    - Make `title` NOT NULL after data migration
    - Keep `name` column for backward compatibility but mark as deprecated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliverables' AND column_name = 'title'
  ) THEN
    ALTER TABLE deliverables ADD COLUMN title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliverables' AND column_name = 'description'
  ) THEN
    ALTER TABLE deliverables ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliverables' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE deliverables ADD COLUMN added_at timestamptz DEFAULT now();
  END IF;
END $$;

UPDATE deliverables SET title = name WHERE title IS NULL;

UPDATE deliverables SET added_at = uploaded_at WHERE added_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliverables' AND column_name = 'title' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE deliverables ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;
