import { isContextMesh } from './constants/contextMeshes';

/**
 * Resolves mesh interaction independently from exposure. A tracked muscle stays
 * selectable at zero exposure; neutral anatomical context never resolves.
 */
export function getSelectableMuscleSlug(
  meshName: string,
  reverseMapping: Record<string, string>
): string | null {
  if (isContextMesh(meshName)) return null;
  return reverseMapping[meshName] ?? null;
}
