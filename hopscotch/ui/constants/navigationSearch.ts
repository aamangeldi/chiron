export const GRID_SIZE = 4;
export const GRID_COLUMNS = 2;
export const GRID_ROWS = 2;

export const PLACEHOLDER_TEXT = "Let's navigate together ;)";

export const HARDCODED_IMAGES = [
  '/search_hardcoded/dress 1.png',
  '/search_hardcoded/dress 2.png',
  '/search_hardcoded/dress 3.png',
  '/search_hardcoded/dress 4.png',
];

export enum ControlType {
  SMALL_VARIATION = 'small_variation',
  LARGE_VARIATION = 'large_variation',
  REROLL = 'reroll',
  OPEN_TABS = 'open_tabs'
}

export interface ControlButton {
  id: string;
  label: string;
  type: ControlType;
  gridIndex?: number;
  row: number;
}

export const CONTROL_BUTTONS: ControlButton[] = [
  // Top row: S1-S4 and reroll
  { id: 's1', label: 'S1', type: ControlType.SMALL_VARIATION, gridIndex: 0, row: 0 },
  { id: 's2', label: 'S2', type: ControlType.SMALL_VARIATION, gridIndex: 1, row: 0 },
  { id: 's3', label: 'S3', type: ControlType.SMALL_VARIATION, gridIndex: 2, row: 0 },
  { id: 's4', label: 'S4', type: ControlType.SMALL_VARIATION, gridIndex: 3, row: 0 },
  { id: 'reroll', label: '🔄', type: ControlType.REROLL, row: 0 },
  // Bottom row: L1-L4 and open tabs
  { id: 'l1', label: 'L1', type: ControlType.LARGE_VARIATION, gridIndex: 0, row: 1 },
  { id: 'l2', label: 'L2', type: ControlType.LARGE_VARIATION, gridIndex: 1, row: 1 },
  { id: 'l3', label: 'L3', type: ControlType.LARGE_VARIATION, gridIndex: 2, row: 1 },
  { id: 'l4', label: 'L4', type: ControlType.LARGE_VARIATION, gridIndex: 3, row: 1 },
  { id: 'open_tabs', label: '⧉', type: ControlType.OPEN_TABS, row: 1 },
];
