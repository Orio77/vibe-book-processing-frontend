import { SvelteSet } from 'svelte/reactivity';

export class SelectionStore {
    isSelectionMode = $state(false);
    selectedSentenceIds = new SvelteSet<number>();
    
    // Internal dragging state
    isDragging = $state(false);
    dragMode = $state<'select' | 'deselect'>('select');

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        if (!this.isSelectionMode) {
            this.clearSelection();
        }
    }

    setSelectionMode(value: boolean) {
        this.isSelectionMode = value;
        if (!this.isSelectionMode) {
            this.clearSelection();
        }
    }

    toggleSentence(id: number, forceAdd?: boolean) {
        if (forceAdd) {
            this.selectedSentenceIds.add(id);
        } else if (this.selectedSentenceIds.has(id)) {
            this.selectedSentenceIds.delete(id);
        } else {
            this.selectedSentenceIds.add(id);
        }
    }

    addSentence(id: number) {
        this.selectedSentenceIds.add(id);
    }
    
    removeSentence(id: number) {
        this.selectedSentenceIds.delete(id);
    }

    clearSelection() {
        this.selectedSentenceIds.clear();
    }

    isSelected(id: number): boolean {
        return this.selectedSentenceIds.has(id);
    }

    startDragging(mode: 'select' | 'deselect' = 'select') {
        this.isDragging = true;
        this.dragMode = mode;
    }

    stopDragging() {
        this.isDragging = false;
    }

    handleDragOver(id: number) {
        if (!this.isDragging) return;
        if (this.dragMode === 'select') {
            this.selectedSentenceIds.add(id);
        } else {
            this.selectedSentenceIds.delete(id);
        }
    }

    get count(): number {
        return this.selectedSentenceIds.size;
    }
}

export const selectionStore = new SelectionStore();
