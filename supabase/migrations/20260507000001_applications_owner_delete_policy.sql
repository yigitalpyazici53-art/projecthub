-- Allow project owners to delete applications to their own projects.
-- Required so the delete-project flow can clean up applications before
-- removing the project row (applications.project_id may not CASCADE).
-- RLS on the projects table already ensures only the real owner can delete.

CREATE POLICY "applications: project owner delete"
  ON applications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id        = applications.project_id
        AND projects.owner_id  = auth.uid()
    )
  );
