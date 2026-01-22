import { GRID } from "../../shared/constants.js";

export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.buckets = new Map();
  }

  // Generate Key for Cell
  getKey(col, row) {
    return `${Math.floor(col)}_${Math.floor(row)}`;
  }

  clear() {
    this.buckets.clear();
  }

  insert(entity) {
    // Determine cell range (entity might overlap multiple cells)
    // For simplicity, we assume entity is mostly in one cell based on center,
    // OR we check bounding box. 
    // Optimization: Just insert center point for now. 
    // If unit is large (radius > cell/2), we might need multi-cell insert.
    // Given Radius ~0.5 and Cell ~2.0, center point is usually enough unless exactly on border.
    // To be safe for Collision, we should insert into all overlapped cells.
    
    // Bounding Box
    const startCol = Math.max(-5, Math.floor((entity.col - entity.radius) / this.cellSize));
    const endCol   = Math.min(50, Math.floor((entity.col + entity.radius) / this.cellSize));
    const startRow = Math.max(-5, Math.floor((entity.row - entity.radius) / this.cellSize));
    const endRow   = Math.min(50, Math.floor((entity.row + entity.radius) / this.cellSize));

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        const key = `${c}_${r}`;
        if (!this.buckets.has(key)) {
          this.buckets.set(key, []);
        }
        this.buckets.get(key).push(entity);
      }
    }
  }

  // Get potential candidates
  query(x, y, radius) {
    const startCol = Math.max(-5, Math.floor((x - radius) / this.cellSize));
    const endCol   = Math.min(50, Math.floor((x + radius) / this.cellSize));
    const startRow = Math.max(-5, Math.floor((y - radius) / this.cellSize));
    const endRow   = Math.min(50, Math.floor((y + radius) / this.cellSize));

    const candidates = new Set(); // Use Set to avoid duplicates

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        const key = `${c}_${r}`;
        const bucket = this.buckets.get(key);
        if (bucket) {
          for (const ent of bucket) {
            candidates.add(ent);
          }
        }
      }
    }
    return candidates;
  }
}
