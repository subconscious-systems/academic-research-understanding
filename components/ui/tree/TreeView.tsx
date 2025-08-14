/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { BookOpenCheck, Drill, Globe, Loader2 } from 'lucide-react';
import { TaskNodeTooltip } from './TaskNodeTooltip';

export interface ModelResponse {
  reasoning: Task[];
  answer: string;
}

export interface Task {
  thought?: string;
  title?: string;
  tooluse?: ToolCall;
  subtasks?: Task[];
  conclusion?: string;
}

export interface ToolCall {
  parameters?: any;
  tool_name?: string;
  tool_result?: any;
}

// Given a nested ModelResponse, strip out everything except title, tooluse.tool_name, and subtasks
export const stripOutEverythingExceptTitleToolNameAndSubtasks = (
  response: ModelResponse,
): ModelResponse => {
  const stripTask = (task: Task): Task => ({
    ...task,
    tooluse: task.tooluse
      ? {
          tool_name: task?.tooluse?.tool_name,
          parameters: task?.tooluse?.parameters,
          tool_result: !!task?.tooluse?.tool_result ? '✓' : '',
        }
      : undefined,
    conclusion: !!task?.conclusion ? '✓' : '',
    subtasks: task?.subtasks ? task?.subtasks.map(stripTask) : undefined,
  });

  const strippedResponse = {
    reasoning: response?.reasoning?.map(stripTask),
    answer: response?.answer,
  };
  return strippedResponse;
};

const outputToArray = (reasoningTasks: Task[]) => {
  // Helper to calculate the maximum depth of reasoning tasks
  const getMaxDepth = (tasks: Task[]): number => {
    let maxDepth = 0;

    const traverse = (task: Task, currentDepth: number) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask) => traverse(subtask, currentDepth + 1));
      }
    };

    tasks.forEach((task) => traverse(task, 0));
    return maxDepth;
  };

  // Determine number of columns based on depth
  const maxDepth = getMaxDepth(reasoningTasks);
  let numNodeColumns: number;

  if (maxDepth <= 2) {
    numNodeColumns = 3; // Tasks only go to depth 1-2, use minimum 3 columns
  } else if (maxDepth <= 3) {
    numNodeColumns = 4; // Tasks go to depth 3, use 4 columns
  } else {
    numNodeColumns = 5; // Tasks go deeper, use maximum 5 columns
  }

  const totalColumns = numNodeColumns * 2; // Include connection columns

  // Helper to create a node object for the grid
  const makeNode = (node: Task) => {
    if ('title' in node) {
      return {
        thought: node.thought,
        title: node.title || node.thought, // fallback if no title
        tooluse: node.tooluse || false,
        conclusion: node.conclusion,
        subtasks: node.subtasks ? node.subtasks.length : 0,
      };
    }
  };

  // Helper to create a connection object
  const makeConnection = ({ up = false, down = false, left = false, right = false }) => ({
    up,
    down,
    left,
    right,
  });

  // Recursive function to build rows
  const buildRows = (node: any, depth: number): any[][] => {
    const maxAllowedDepth = numNodeColumns - 1; // Convert columns to max depth
    if (depth > maxAllowedDepth) {
      // If we're at max depth, do not render any children (i.e., treat as leaf)
      const col = depth * 2 + 1; // Shift by 1 for the new column
      const row = Array(totalColumns).fill(null);
      row[col] = makeNode(node);
      return [row];
    }
    const col = depth * 2 + 1; // Shift by 1 for the new column
    const rows: any[][] = [];
    // Only include children up to max depth
    const validSubtasks = (node.subtasks || []).filter(() => depth < maxAllowedDepth);
    if (!validSubtasks || validSubtasks.length === 0) {
      // Leaf node
      const row = Array(totalColumns).fill(null);
      row[col] = makeNode(node);
      rows.push(row);
      return rows;
    }
    // Non-leaf node
    let childRows: any[][] = [];
    validSubtasks.forEach((child: any) => {
      const childSubRows = buildRows(child, depth + 1);
      childRows = childRows.concat(childSubRows);
    });
    // For each child row, add parent node and connection
    let start = 0;
    const numChildren = validSubtasks.length;
    validSubtasks.forEach((child: any, i: number) => {
      const childSubRows = buildRows(child, depth + 1);
      for (let j = 0; j < childSubRows.length; j++) {
        const row = Array(totalColumns).fill(null);
        // Only the first child row gets the parent node
        if (j === 0 && i === 0) {
          row[col] = makeNode(node);
        }
        // Connection object
        if (col + 1 < totalColumns) {
          // Only add a connection if there is a node to the right in this row
          if (childSubRows[j][col + 2]) {
            let conn;
            if (numChildren === 1) {
              conn = makeConnection({ left: true, right: true });
            } else if (i === 0) {
              conn = makeConnection({ left: true, right: true, down: true });
            } else if (i === numChildren - 1) {
              conn = makeConnection({ right: true, up: true });
            } else {
              conn = makeConnection({ right: true, up: true, down: true });
            }
            if (conn.left || conn.right || conn.up || conn.down) {
              row[col + 1] = conn;
            }
          }
        }
        // Copy child node/connection from childSubRows
        for (let k = col + 2; k < totalColumns; k++) {
          row[k] = childSubRows[j][k];
        }
        rows.push(row);
      }
      start += childSubRows.length;
    });
    return rows;
  };

  // Build unified grid from all reasoning tasks
  let unifiedGrid: any[][] = [];

  reasoningTasks.forEach((task) => {
    const taskGrid = buildRows(task, 0);
    unifiedGrid = unifiedGrid.concat(taskGrid);
  });

  // Add connection lines from all first items of reasoning tasks to the top
  if (unifiedGrid.length > 0) {
    // Find all rows that have nodes in column 1 (first items of reasoning tasks)
    const firstTaskRowIndices = [];
    for (let rowIdx = 0; rowIdx < unifiedGrid.length; rowIdx++) {
      if (unifiedGrid[rowIdx][1] && unifiedGrid[rowIdx][1].thought !== undefined) {
        firstTaskRowIndices.push(rowIdx);
      }
    }

    if (firstTaskRowIndices.length > 0) {
      // Find the maximum row index to determine the full vertical line extent
      const maxRowIndex = Math.max(...firstTaskRowIndices);

      // Add continuous vertical line from top to the last first item
      for (let rowIdx = 0; rowIdx <= maxRowIndex; rowIdx++) {
        if (firstTaskRowIndices.includes(rowIdx)) {
          // This row has a first item, add horizontal connection
          if (rowIdx === maxRowIndex) {
            // Last first item - don't add down connection
            unifiedGrid[rowIdx][0] = makeConnection({ up: true, right: true });
          } else {
            // Not the last first item - add both up and down connections
            unifiedGrid[rowIdx][0] = makeConnection({ up: true, down: true, right: true });
          }
        } else {
          // This row is just part of the vertical line
          unifiedGrid[rowIdx][0] = makeConnection({ up: true, down: true });
        }
      }
    }
  }

  // Improved post-process for (up, down) connectors
  for (let col = 2; col < totalColumns; col += 2) {
    // Only connection columns (shifted by 1)
    // If there is a "down" connector above, an "up" connector below, and the cell to the right is empty, add a "up, down" connector
    for (let rowIdx = 1; rowIdx < unifiedGrid.length - 1; rowIdx++) {
      const prevRow = unifiedGrid[rowIdx - 1][col];
      const currentCell = unifiedGrid[rowIdx][col];
      const rightCell = unifiedGrid[rowIdx][col + 1];

      if (prevRow && prevRow.down && !rightCell && !currentCell) {
        unifiedGrid[rowIdx][col] = makeConnection({ up: true, down: true });
      }
    }
  }

  return { grid: unifiedGrid, totalColumns, numNodeColumns };
};

export const TreeView = ({ output }: { output: any }) => {
  if (!output) return null;

  const result =
    output.reasoning && output.reasoning.length > 0 ? outputToArray(output.reasoning) : null;

  if (!result) return null;

  const { grid, totalColumns } = result;

  // Generate dynamic grid template columns
  const generateGridTemplate = (columns: number) => {
    const template = [];
    for (let i = 0; i < columns; i++) {
      if (i % 2 === 0) {
        template.push('0.2fr'); // Connection columns (even indices)
      } else {
        template.push('1fr'); // Node columns (odd indices)
      }
    }
    return template.join(' ');
  };

  const gridTemplate = generateGridTemplate(totalColumns);

  return (
    <>
      {grid.length > 0 && (
        <div className="flex flex-col">
          <div className="grid h-2 w-full" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="grid h-full w-full grid-cols-2">
              <div className={cn('h-full w-full border-r-2 border-gray-600')}></div>
              <div className={cn('h-full w-full border-gray-600')}></div>
              <div className={cn('h-full w-full border-r-2 border-gray-600')}></div>
              <div className="h-full w-full"></div>
            </div>
          </div>
          {grid.map((row: any[], rowIndex: number) => (
            <div
              key={`row-${rowIndex}`}
              className="grid w-full"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {row.map((cell, colIndex) => {
                const cellKey = `cell-${rowIndex}-${colIndex}`;
                if (!cell) {
                  return <div key={cellKey} className="h-full min-h-[48px] w-full" />;
                }
                // Node cell
                if (cell.thought !== undefined) {
                  return (
                    <TaskNodeTooltip key={cellKey} cell={cell} cellKey={cellKey}>
                      <div className="animate-in fade-in slide-in-from-left-4 flex h-full w-full min-w-0 cursor-default items-center justify-center py-2 duration-200">
                        <div className="border-primary/20 bg-primary/5 flex h-fit min-h-[48px] w-full min-w-0 flex-1 flex-col items-start justify-start rounded-md border p-2">
                          <div className="mb-1 w-full min-w-0 truncate text-xs font-bold">
                            {cell.title || cell.thought}
                          </div>
                          {cell.tooluse && cell.tooluse.tool_name === 'SearchTool' && (
                            <div className="border-primary/20 bg-primary/10 mb-1 flex w-full items-center gap-1 truncate rounded-md border p-1 text-xs">
                              <Globe className="h-3 w-3" />
                              <span className="font-medium">Search Tool</span>
                            </div>
                          )}
                          {cell.tooluse && cell.tooluse.tool_name === 'ReaderTool' && (
                            <div className="border-primary/20 bg-primary/10 mb-1 flex w-full items-center gap-1 truncate rounded-md border p-1 text-xs">
                              <BookOpenCheck className="h-3 w-3" />
                              <span className="font-medium">Webpage Understanding</span>
                            </div>
                          )}
                          {cell.tooluse &&
                            !!cell.tooluse.tool_name &&
                            cell.tooluse.tool_name !== 'SearchTool' &&
                            cell.tooluse.tool_name !== 'ReaderTool' && (
                              <div className="border-primary/20 bg-primary/10 mb-1 flex w-full items-center gap-1 truncate rounded-md border p-1 text-xs">
                                <Drill className="h-3 w-3" />
                                <span className="font-medium">{cell.tooluse.tool_name}</span>
                              </div>
                            )}
                          <div
                            className={cn(
                              'w-full min-w-0 items-center gap-1 truncate text-xs font-medium',
                              !cell.conclusion && 'flex', // This makes the truncate text work right
                            )}
                          >
                            {cell.conclusion ? (
                              <span className="animate-in fade-in slide-in-from-left-4 duration-200">
                                {cell.conclusion}
                              </span>
                            ) : (
                              <>
                                {!cell.conclusion && !cell.tooluse?.tool_result ? (
                                  <span>
                                    <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                                  </span>
                                ) : (
                                  <span className="animate-in fade-in slide-in-from-left-4 duration-200">
                                    ✓
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TaskNodeTooltip>
                  );
                }
                // Connection cell
                if (cell.left !== undefined) {
                  return (
                    <div key={cellKey} className="grid h-full w-full grid-cols-2">
                      <div
                        className={cn(
                          'h-full w-full border-gray-600',
                          cell.left && 'border-b-2',
                          cell.up && 'border-r-2',
                        )}
                      ></div>
                      <div
                        className={cn('h-full w-full border-gray-600', cell.right && 'border-b-2')}
                      ></div>
                      <div
                        className={cn('h-full w-full border-gray-600', cell.down && 'border-r-2')}
                      ></div>
                      <div className="h-full w-full"></div>
                    </div>
                  );
                }
                // Fallback
                return <div key={cellKey} className="min-h-[48px]" />;
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
