import { ColoringPreset } from '../types';

/**
 * Auto-generates the next preset name starting with '새파일1'.
 * If '새파일1' already exists, increments to '새파일2', '새파일3', etc.
 */
export const getNextPresetName = (presets: ColoringPreset[]): string => {
  const existingNames = new Set(presets.map((p) => p.name.trim()));
  let num = 1;
  while (existingNames.has(`새파일${num}`)) {
    num++;
  }
  return `새파일${num}`;
};
