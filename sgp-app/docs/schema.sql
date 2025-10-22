-- Create the templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security (RLS) for the templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to select their own templates
CREATE POLICY "Allow users to select their own templates"
ON templates
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to insert their own templates
CREATE POLICY "Allow users to insert their own templates"
ON templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own templates
CREATE POLICY "Allow users to update their own templates"
ON templates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own templates
CREATE POLICY "Allow users to delete their own templates"
ON templates
FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to call the function before any update
CREATE TRIGGER on_template_update
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();
