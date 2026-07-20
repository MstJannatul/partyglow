-- Add vendor response capabilities to existing reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpfulness_score INTEGER DEFAULT 0;

-- Simple helpfulness voting
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on review_votes
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for review votes
CREATE POLICY "Users can view all review votes" 
ON review_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON review_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON review_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON review_votes 
FOR DELETE 
USING (auth.uid() = user_id);