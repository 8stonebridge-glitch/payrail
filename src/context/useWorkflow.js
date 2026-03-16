import { useContext } from 'react';
import { WorkflowStoreContext } from './workflowStoreContext';

export function useWorkflow() {
  return useContext(WorkflowStoreContext);
}
