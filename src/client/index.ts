import type { AxiosInstance } from "axios";

import type { IterableConfig } from "../types/common.js";
import { BaseIterableClient } from "./base.js";
import { Campaigns } from "./campaigns.js";
import { Catalogs } from "./catalogs.js";
import { Events } from "./events.js";
import { Experiments } from "./experiments.js";
import { Export } from "./export.js";
import { Journeys } from "./journeys.js";
import { Lists } from "./lists.js";
import { Messaging } from "./messaging.js";
import { Snippets } from "./snippets.js";
import { Subscriptions } from "./subscriptions.js";
import { Templates } from "./templates.js";
import { Users } from "./users.js";
import { Webhooks } from "./webhooks.js";

type Constructor<T = object> = new (...args: any[]) => T;

type UnionToIntersection<U> = (U extends any ? (k: U) => 0 : never) extends (
  k: infer I
) => 0
  ? I
  : never;

// Extract the instance type from our mixin functions
type ExtractMixinInstance<T> =
  T extends <B extends Constructor<any>>(base: B) => Constructor<infer R>
    ? R
    : never;

function compose<
  Base extends Constructor,
  Mixins extends Array<(base: any) => any>,
>(base: Base, ...mixins: Mixins) {
  type Mixed = UnionToIntersection<
    | InstanceType<Base>
    | { [K in keyof Mixins]: ExtractMixinInstance<Mixins[K]> }[number]
  >;

  return mixins.reduce<Constructor<any>>(
    (acc, mixin) => mixin(acc),
    base as Constructor<any>
  ) as unknown as new (...args: any[]) => Mixed;
}

/**
 * Main Iterable API client composed from domain mixins
 * This approach keeps all methods at the top level (client.getUserByEmail())
 * while organizing code into separate domain files
 */
export class IterableClient extends compose(
  BaseIterableClient,
  Campaigns,
  Catalogs,
  Events,
  Experiments,
  Export,
  Journeys,
  Lists,
  Messaging,
  Snippets,
  Subscriptions,
  Templates,
  Users,
  Webhooks
) {
  /**
   * Create a new Iterable API client
   *
   * @param config - Optional configuration object. If not provided, will use environment variables
   * @param injectedClient - Optional pre-configured Axios instance for testing
   */
  constructor(config?: IterableConfig, injectedClient?: AxiosInstance) {
    super(config, injectedClient);
  }
}
