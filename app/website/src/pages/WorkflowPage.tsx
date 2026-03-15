import { PageFrame } from "../components/PageFrame";
import { officialDocumentationLinks, workflowSteps } from "../data/siteContent";
import { WorkflowSection } from "../sections/WorkflowSection";

export function WorkflowPage() {
  return (
    <PageFrame>
      <WorkflowSection
        steps={workflowSteps}
        documentationLinks={officialDocumentationLinks}
      />
    </PageFrame>
  );
}
