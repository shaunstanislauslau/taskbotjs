import Bunyan from "bunyan";

import {
  JobDescriptor,
  IDependencies,
  ClientPool,
  ClientRoot
} from "@taskbotjs/client";

import { ConfigBase, IntakeConfig } from "../../Config";
import { ClientRequest } from "http";

export interface IIntake {
  initialize(): void;
  stop(): void;
  doFetch(): Promise<JobDescriptor | null>;
}

export abstract class Intake<TIntakeConfig extends IntakeConfig> {
  protected readonly intakeConfig: TIntakeConfig;
  protected readonly logger: Bunyan;
  protected readonly clientPool: ClientPool;

  private isStopped: boolean = false;

  constructor(intakeConfig: TIntakeConfig, clientPool: ClientPool, baseLogger: Bunyan) {
    this.intakeConfig = intakeConfig;
    this.clientPool = clientPool;
    this.logger = baseLogger.child({ component: this.constructor.name });
  }

  initialize(): void {
  }

  stop(): void {
    this.isStopped = true;
  }

  async doFetch(): Promise<JobDescriptor | null> {
    // once we've hit shutdown, we should stop returning new jobs as
    // quickly as possible so that currently extant
    if (this.isStopped) {
      return null;
    }

    this.logger.trace("Fetching.");
    return this.clientPool.use(async (taskbot) => taskbot.connected ? this.fetch(taskbot) : null);
  }

  abstract async fetch(client: ClientRoot): Promise<JobDescriptor | null>;
};