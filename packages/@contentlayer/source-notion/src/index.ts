import type * as core from '@contentlayer/core'
import { processArgs } from '@contentlayer/core'
import { pipe, S, SC, T } from '@contentlayer/utils/effect'
import { NotionRenderer } from '@notion-render/client'
import * as notion from '@notionhq/client'

import { fetchData } from './fetchData/fetchData.js'
import { fetchNotion } from './notion/fetchNotion.js'
import { provideSchema } from './schema/provideSchema.js'
import { flattendDatabaseTypeDef } from './schema/utils/flattenDatabaseTypeDef.js'
import { NotionClient, NotionRenderer as NotionRendererTag } from './services.js'
import type { PluginOptions } from './types.js'

export * from './schema/types/database.js'

export const makeSource: core.MakeSourcePlugin<PluginOptions & core.PartialArgs> = (args) => async (sourceKey) => {
  const {
    options,
    extensions,
    restArgs: { databaseTypes, ...rest },
  } = await processArgs(args, sourceKey)

  const databaseTypeDefs = (Array.isArray(databaseTypes) ? databaseTypes : Object.values(databaseTypes)).map((_) =>
    _.def(),
  )

  const client =
    rest.client instanceof notion.Client
      ? rest.client
      : new notion.Client({
          fetch: fetchNotion,
          ...rest.client,
        })

  const renderer =
    rest.renderer instanceof NotionRenderer ? rest.renderer : new NotionRenderer({ client, ...rest.renderer })

  return {
    type: 'notion',
    extensions,
    options,
    provideSchema: () =>
      pipe(
        S.fromEffect(
          pipe(
            provideSchema({ databaseTypeDefs, options }),
            T.provideService(NotionClient)(client),
            T.provideService(NotionRendererTag)(renderer),
          ),
        ),
        S.repeatSchedule(SC.spaced(5_000)),
      ),
    fetchData: ({ schemaDef }) =>
      pipe(
        S.fromEffect(
          pipe(
            fetchData({
              databaseTypeDefs: databaseTypeDefs.map((databaseTypeDef) => flattendDatabaseTypeDef(databaseTypeDef)),
              schemaDef,
              options,
            }),
            T.either,
            T.provideService(NotionClient)(client),
            T.provideService(NotionRendererTag)(renderer),
          ),
        ),
      ),
  }
}
