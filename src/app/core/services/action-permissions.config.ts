import { AccessMode } from '../../shared/models/auth.types';

/**
 * Configuration for an entity action
 */
export interface ActionConfig {
  /** Permission(s) required to perform this action */
  permission: string | string[];
  /** How to handle lack of permission: 'hide' removes element, 'disable' grays it out */
  mode: AccessMode;
  /** Tooltip shown when action is disabled due to lack of permission */
  disabledTooltip?: string;
}

/**
 * Centralized action permissions configuration
 *
 * Defines permissions required for each entity action and how
 * the UI should behave when the user lacks permission.
 */
export const ACTION_PERMISSIONS = {
  // ============================================
  // Member Actions
  // ============================================
  member: {
    create: {
      permission: 'member.create',
      mode: 'hide' as const
    },
    edit: {
      permission: 'member.update',
      mode: 'hide' as const
    },
    view: {
      permission: 'member.read',
      mode: 'hide' as const
    },
    suspend: {
      permission: 'member.suspend',
      mode: 'disable' as const,
      disabledTooltip: 'You need member.suspend permission'
    },
    reactivate: {
      permission: 'member.reactivate',
      mode: 'disable' as const,
      disabledTooltip: 'You need member.reactivate permission'
    },
    delete: {
      permission: 'member.delete',
      mode: 'disable' as const,
      disabledTooltip: 'Only administrators can delete members'
    },
    export: {
      permission: 'member.export',
      mode: 'hide' as const
    },
    viewWallet: {
      permission: 'wallet.balance.read',
      mode: 'hide' as const
    },
    createNominee: {
      permission: 'member.nominee.create',
      mode: 'disable' as const
    },
    editNominee: {
      permission: 'member.nominee.update',
      mode: 'disable' as const
    },
    viewDocument: {
      permission: 'member.document.read',
      mode: 'hide' as const
    },
    uploadDocument: {
      permission: 'member.document.upload',
      mode: 'disable' as const
    },
    deleteDocument: {
      permission: 'member.document.delete',
      mode: 'disable' as const
    },
  },

  // ============================================
  // Agent Actions
  // ============================================
  agent: {
    create: {
      permission: 'agent.create',
      mode: 'disable' as const
    },
    edit: {
      permission: 'agent.update',
      mode: 'disable' as const
    },
    editProfile: {
      permission: 'agent.profile.update',
      mode: 'disable' as const
    },
    view: {
      permission: 'agent.read',
      mode: 'hide' as const
    },
    deactivate: {
      permission: 'agent.deactivate',
      mode: 'disable' as const,
      disabledTooltip: 'You need agent.deactivate permission'
    },
    suspend: {
      permission: 'agent.suspend',
      mode: 'disable' as const,
      disabledTooltip: 'You need agent.suspend permission'
    },
    reassign: {
      permission: 'agent.reassign',
      mode: 'disable' as const,
      disabledTooltip: 'You need agent.reassign permission'
    }
  },

  // ============================================
  // Wallet Actions
  // ============================================
  wallet: {
    view: {
      permission: 'wallet.balance.view',
      mode: 'hide' as const
    },
    requestDeposit: {
      permission: 'wallet.deposit.request',
      mode: 'hide' as const
    },
    approveDeposit: {
      permission: 'wallet.deposit.approve',
      mode: 'disable' as const,
      disabledTooltip: 'You need deposit approval permission'
    }
  },

  // ============================================
  // Approval Actions
  // ============================================
  approvalWorkflow: {
    view: {
      permission: 'approval.workflow.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'approval.workflow.create',
      mode: 'disable' as const
    },
    edit: {
      permission: 'approval.workflow.update',
      mode: 'disable' as const
    },
  },
  approvalStageRequest: {
    view: {
      permission: 'approval.read',
      mode: 'hide' as const
    },
    execute: {
      permission: 'approval.execute',
      mode: 'disable' as const,
      disabledTooltip: 'You are not assigned to approve this'
    },
    reassign: {
      permission: 'approval.reassign',
      mode: 'hide' as const
    }
  },

  // ============================================
  // Death Claim Actions
  // ============================================
  deathClaim: {
    create: {
      permission: 'death_claim.report',
      mode: 'hide' as const
    },
    verify: {
      permission: 'death_claim.verify',
      mode: 'disable' as const,
      disabledTooltip: 'You need verification permission'
    },
    approve: {
      permission: 'death_claim.approve',
      mode: 'disable' as const,
      disabledTooltip: 'You need approval permission'
    },
    settle: {
      permission: 'death_claim.settle',
      mode: 'disable' as const,
      disabledTooltip: 'You need settlement permission'
    }
  },

  // ============================================
  // Contribution Actions
  // ============================================
  contribution: {
    view: {
      permission: 'contribution.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'contribution.create',
      mode: 'hide' as const
    },
    collect: {
      permission: 'contribution.collect',
      mode: 'disable' as const,
      disabledTooltip: 'You need contribution collection permission'
    }
  },

  // ============================================
  // Role Management Actions
  // ============================================
  role: {
    view: {
      permission: 'iam.role.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'iam.role.create',
      mode: 'hide' as const
    },
    edit: {
      permission: 'iam.role.update',
      mode: 'hide' as const
    },
    delete: {
      permission: 'iam.role.delete',
      mode: 'disable' as const,
      disabledTooltip: 'Only administrators can delete roles'
    },
    assign: {
      permission: 'iam.role.assign',
      mode: 'disable' as const,
      disabledTooltip: 'You need role assignment permission'
    }
  },

  // ============================================
  // User Management Actions
  // ============================================
  user: {
    view: {
      permission: 'iam.user.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'iam.user.create',
      mode: 'hide' as const
    },
    edit: {
      permission: 'iam.user.update',
      mode: 'hide' as const
    },
    deactivate: {
      permission: 'iam.user.deactivate',
      mode: 'disable' as const,
      disabledTooltip: 'You need user deactivation permission'
    }
  },

  // ============================================
  // Forum/Area/Unit Actions
  // ============================================
  forum: {
    view: {
      permission: 'org.forum.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'org.forum.create',
      mode: 'disable' as const
    },
    edit: {
      permission: 'org.forum.update',
      mode: 'disable' as const
    }
  },

  area: {
    view: {
      permission: 'org.area.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'org.area.create',
      mode: 'disable' as const
    },
    edit: {
      permission: 'org.area.update',
      mode: 'disable' as const
    }
  },

  unit: {
    view: {
      permission: 'org.unit.read',
      mode: 'hide' as const
    },
    create: {
      permission: 'org.unit.create',
      mode: 'disable' as const
    },
    edit: {
      permission: 'org.unit.update',
      mode: 'disable' as const
    }
  }
} as const;

/**
 * Type representing all entity types with defined actions
 */
export type EntityType = keyof typeof ACTION_PERMISSIONS;

/**
 * Type helper to get action types for a specific entity
 */
export type EntityActionType<E extends EntityType> = keyof (typeof ACTION_PERMISSIONS)[E];
