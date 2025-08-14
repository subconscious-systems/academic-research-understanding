import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskNodeTooltipProps {
  cell: {
    title?: string;
    thought: string;
    tooluse?: {
      tool_name: string;
      parameters?: any;
      tool_result?: any;
    };
    subtasks: number;
    conclusion?: string;
  };
  cellKey: string;
  children: React.ReactNode;
}

export const TaskNodeTooltip: React.FC<TaskNodeTooltipProps> = ({ cell, cellKey, children }) => {
  const tooltipContent = (
    <div className="space-y-1 whitespace-pre-line text-left text-xs">
      <div className="font-semibold text-primary">{cell.title || 'Subtask'}</div>
      <div>
        <span className="font-semibold">Thought:</span>{' '}
        <span className="break-words">{cell.thought}</span>
      </div>
      {cell.tooluse && (
        <div className="space-y-1">
          <div>
            <span className="font-semibold">Tool Name:</span> {cell.tooluse.tool_name}
          </div>
          {cell.tooluse.parameters && (
            <div>
              <span className="font-semibold">Parameters:</span>{' '}
              <span className="break-words">
                {(() => {
                  try {
                    return JSON.stringify(cell.tooluse.parameters, null, 2);
                  } catch (error) {
                    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                  }
                })()}
              </span>
            </div>
          )}
          <div>
            <span className="font-semibold">Tool Result Preview:</span>{' '}
            <span
              className="block max-h-40 overflow-y-auto truncate break-words"
              style={{ display: 'block', maxHeight: '10em', overflowY: 'auto' }}
            >
              {(() => {
                try {
                  return JSON.stringify(cell.tooluse?.tool_result, null, 2)?.slice(0, 1000);
                } catch (error) {
                  return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }
              })()}
              ...
            </span>
          </div>
        </div>
      )}
      <div>
        <span className="font-semibold">Subtasks:</span> {!!cell.subtasks ? cell.subtasks : 'None'}
      </div>
      <div>
        <span className="font-semibold">Conclusion:</span>{' '}
        <span className="break-words">{!!cell.tooluse ? 'Tool Use' : cell.conclusion}</span>
      </div>
    </div>
  );

  return (
    <TooltipProvider key={`tp-${cellKey}`} delayDuration={100}>
      <Tooltip key={`t-${cellKey}`}>
        <TooltipTrigger asChild key={`tt-${cellKey}`}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-lg rounded-md border border-gray-200 bg-white p-3 shadow-lg"
          key={`tc-${cellKey}`}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
