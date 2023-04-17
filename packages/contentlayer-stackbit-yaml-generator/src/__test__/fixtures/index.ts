import { provideJaegerTracing } from '@contentlayer/utils'
import { O, pipe, provideConsole, S, T } from '@contentlayer/utils/effect'
import type { DocumentType } from 'contentlayer/source-files'
import { makeSource } from 'contentlayer/source-files'

import * as azimuth from './azimuth-schema/index.js'
import * as blog from './blog-schema/index.js'

export const makeAzimuthSchema = () => makeSchema(azimuth)
export const makeBlogSchema = () => makeSchema(blog)

const esbuildHash = 'not-important-for-this-test'

const makeSchema = (documentTypes: Record<string, DocumentType<any>>) =>
  pipe(
    T.tryPromise(() => makeSource({ documentTypes, contentDirPath: '' })(undefined)),
    T.chain((source) => pipe(source.provideSchema(esbuildHash), S.runHead, T.map(O.getUnsafe))),
    provideJaegerTracing('contentlayer-cli'),
    provideConsole,
    T.runPromise,
  )
