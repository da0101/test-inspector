import { TestFrameworkAdapter } from './types';
import { ReactAdapter } from './react';
import { FlutterAdapter } from './flutter';
import { DjangoAdapter, FastApiAdapter } from './python';
import { FirebaseFunctionsAdapter } from './firebase';

export function createAdapters(): TestFrameworkAdapter[] {
  return [
    new ReactAdapter(),
    new FlutterAdapter(),
    new DjangoAdapter(),
    new FastApiAdapter(),
    new FirebaseFunctionsAdapter()
  ];
}
