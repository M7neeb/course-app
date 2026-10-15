// Lesson content is a list of typed blocks. Each type has one renderer registered here.
// New block type = new folder + one register call in index.ts. Nothing else changes.

import type { Component } from 'svelte';
import type { Block, BlockContext } from '../core/types.ts';

export type BlockProps = { block: Block; ctx: BlockContext };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockComponent = Component<any>;

const renderers = new Map<string, BlockComponent>();

export function registerBlock(type: string, component: BlockComponent): void {
  renderers.set(type, component);
}

export function getBlockRenderer(type: string): BlockComponent | undefined {
  return renderers.get(type);
}
