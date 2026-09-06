/* ============================================================
   Seed Data — Initial mock data for first-load population
   ============================================================ */

import { generateId, randomDate, randomFromArray, randomInt } from '../utils.js';
import { Store, Collections } from '../store.js';

export function seedAll() {
  if (Store.isSeeded()) return false;

  seedDevices();
  seedUsers();
  seedCompliancePolicies();
  seedConfigProfiles();
  seedApps();
  seedRoles();
  seedScopeTags();
  seedScripts();
  seedAutopilotProfiles();
  seedAutopilotDevices();
  seedSecurityBaselines();
  seedAntivirusPolicies();
  seedFirewallPolicies();
  seedDiskEncryptionPolicies();
  seedUpdateRings();
  seedAppProtectionPolicies();
  seedConditionalAccess();
  seedAlerts();
  seedNotifications();
  seedIncidents();
  seedConnectors();
  seedESPConfigs();
  seedHelloPolicies();
  seedLAPSPolicies();
  seedDynamicGroups();
  seedCloudPCs();
  seedProvisioningPolicies();
  seedAuditLogs();
  seedCustomization();

  Store.markSeeded();
  return true;
}

export function ensureAuditAndCustomizationSeeded() {
  if (Store.getAll(Collections.AUDIT_LOGS).length === 0) {
    seedAuditLogs();
  }
  if (!Store.get(Collections.CUSTOMIZATION, 'tenant_branding')) {
    seedCustomization();
  }
}

export function resetAndReseed() {
  Store.resetAll();
  seedAll();
}

/* ── Devices ── */
function seedDevices() {
  const devices = [
    {
      id: generateId(), name: 'DESKTOP-WIN01', os: 'Windows', osVersion: 'Windows 11 23H2',
      complianceState: 'Compliant', lastCheckIn: randomDate(1), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Sarah Chen', joinType: 'Entra-joined',
      manufacturer: 'Dell', model: 'Latitude 5540', serialNumber: 'DL5540-' + randomInt(10000, 99999),
      enrolledDate: randomDate(180), managementState: 'Managed', category: 'Corporate devices',
      storageTotal: '512 GB', storageFree: '287 GB', isEncrypted: true, antivirusStatus: 'Active',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
    },
    {
      id: generateId(), name: 'DESKTOP-WIN02', os: 'Windows', osVersion: 'Windows 11 22H2',
      complianceState: 'Noncompliant', lastCheckIn: randomDate(3), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Mike Williams', joinType: 'Hybrid Entra-joined',
      manufacturer: 'Lenovo', model: 'ThinkPad T14s', serialNumber: 'LN-T14S-' + randomInt(10000, 99999),
      enrolledDate: randomDate(120), managementState: 'Managed', category: 'Corporate devices',
      storageTotal: '256 GB', storageFree: '42 GB', isEncrypted: false, antivirusStatus: 'Active',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
      noncompliantReasons: ['Encryption not enabled', 'OS version below minimum'],
    },
    {
      id: generateId(), name: 'DESKTOP-WIN03', os: 'Windows', osVersion: 'Windows 10 22H2',
      complianceState: 'Not evaluated', lastCheckIn: randomDate(14), ownership: 'Personal',
      enrolledBy: 'Sarah Chen', primaryUser: 'Sarah Chen', joinType: 'Entra-registered',
      manufacturer: 'HP', model: 'Pavilion 15', serialNumber: 'HP-PAV-' + randomInt(10000, 99999),
      enrolledDate: randomDate(90), managementState: 'Managed', category: 'BYOD',
      storageTotal: '1 TB', storageFree: '623 GB', isEncrypted: false, antivirusStatus: 'Active',
      defenderStatus: 'Not onboarded', lastSyncStatus: 'Pending',
    },
    {
      id: generateId(), name: 'LAPTOP-WIN04', os: 'Windows', osVersion: 'Windows 11 24H2',
      complianceState: 'Compliant', lastCheckIn: randomDate(0), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Alex Johnson', joinType: 'Entra-joined',
      manufacturer: 'Microsoft', model: 'Surface Laptop 6', serialNumber: 'MS-SL6-' + randomInt(10000, 99999),
      enrolledDate: randomDate(60), managementState: 'Managed', category: 'Corporate devices',
      storageTotal: '512 GB', storageFree: '340 GB', isEncrypted: true, antivirusStatus: 'Active',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
    },
    {
      id: generateId(), name: 'LAPTOP-WIN05', os: 'Windows', osVersion: 'Windows 11 23H2',
      complianceState: 'In grace period', lastCheckIn: randomDate(5), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Mike Williams', joinType: 'Hybrid Entra-joined',
      manufacturer: 'Dell', model: 'XPS 15 9530', serialNumber: 'DL-XPS-' + randomInt(10000, 99999),
      enrolledDate: randomDate(200), managementState: 'Managed', category: 'Corporate devices',
      storageTotal: '1 TB', storageFree: '456 GB', isEncrypted: true, antivirusStatus: 'Out of date',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
      noncompliantReasons: ['Antivirus definitions out of date'],
      graceDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: generateId(), name: 'IPHONE-SARAH', os: 'iOS', osVersion: 'iOS 17.5',
      complianceState: 'Compliant', lastCheckIn: randomDate(0), ownership: 'Personal',
      enrolledBy: 'Sarah Chen', primaryUser: 'Sarah Chen', joinType: 'Entra-registered',
      manufacturer: 'Apple', model: 'iPhone 15 Pro', serialNumber: 'APL-IP15-' + randomInt(10000, 99999),
      enrolledDate: randomDate(45), managementState: 'Managed', category: 'BYOD',
      storageTotal: '256 GB', storageFree: '98 GB', isEncrypted: true, antivirusStatus: 'N/A',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
    },
    {
      id: generateId(), name: 'IPHONE-MIKE', os: 'iOS', osVersion: 'iOS 16.7',
      complianceState: 'Noncompliant', lastCheckIn: randomDate(7), ownership: 'Personal',
      enrolledBy: 'Mike Williams', primaryUser: 'Mike Williams', joinType: 'Entra-registered',
      manufacturer: 'Apple', model: 'iPhone 14', serialNumber: 'APL-IP14-' + randomInt(10000, 99999),
      enrolledDate: randomDate(150), managementState: 'Managed', category: 'BYOD',
      storageTotal: '128 GB', storageFree: '12 GB', isEncrypted: true, antivirusStatus: 'N/A',
      defenderStatus: 'Not onboarded', lastSyncStatus: 'Failed',
      noncompliantReasons: ['OS version below minimum (17.0)'],
    },
    {
      id: generateId(), name: 'IPAD-CORP01', os: 'iPadOS', osVersion: 'iPadOS 17.5',
      complianceState: 'Compliant', lastCheckIn: randomDate(1), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Sarah Chen', joinType: 'Entra-registered',
      manufacturer: 'Apple', model: 'iPad Pro 12.9" (M2)', serialNumber: 'APL-IPAD-' + randomInt(10000, 99999),
      enrolledDate: randomDate(100), managementState: 'Managed', category: 'Shared devices',
      storageTotal: '256 GB', storageFree: '180 GB', isEncrypted: true, antivirusStatus: 'N/A',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
    },
    {
      id: generateId(), name: 'PIXEL-ANDROID01', os: 'Android', osVersion: 'Android 14',
      complianceState: 'Compliant', lastCheckIn: randomDate(0), ownership: 'Personal',
      enrolledBy: 'Mike Williams', primaryUser: 'Mike Williams', joinType: 'Entra-registered',
      manufacturer: 'Google', model: 'Pixel 8 Pro', serialNumber: 'GGL-PX8-' + randomInt(10000, 99999),
      enrolledDate: randomDate(30), managementState: 'Managed', category: 'BYOD',
      storageTotal: '256 GB', storageFree: '189 GB', isEncrypted: true, antivirusStatus: 'N/A',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
      androidManagement: 'Work profile',
    },
    {
      id: generateId(), name: 'SAMSUNG-CORP01', os: 'Android', osVersion: 'Android 13',
      complianceState: 'Noncompliant', lastCheckIn: randomDate(10), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Sarah Chen', joinType: 'Entra-registered',
      manufacturer: 'Samsung', model: 'Galaxy S23', serialNumber: 'SAM-S23-' + randomInt(10000, 99999),
      enrolledDate: randomDate(200), managementState: 'Managed', category: 'Corporate devices',
      storageTotal: '128 GB', storageFree: '45 GB', isEncrypted: true, antivirusStatus: 'Active',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
      androidManagement: 'Fully managed',
      noncompliantReasons: ['OS version below minimum (14)'],
    },
    {
      id: generateId(), name: 'MAC-DESIGN01', os: 'macOS', osVersion: 'macOS 14.5 Sonoma',
      complianceState: 'Compliant', lastCheckIn: randomDate(0), ownership: 'Corporate',
      enrolledBy: 'Alex Johnson', primaryUser: 'Sarah Chen', joinType: 'Entra-joined',
      manufacturer: 'Apple', model: 'MacBook Pro 16" (M3 Pro)', serialNumber: 'APL-MBP-' + randomInt(10000, 99999),
      enrolledDate: randomDate(90), managementState: 'Managed', category: 'Corporate devices',
      storageTotal: '1 TB', storageFree: '567 GB', isEncrypted: true, antivirusStatus: 'Active',
      defenderStatus: 'Onboarded', lastSyncStatus: 'Success',
    },
    {
      id: generateId(), name: 'MAC-PERSONAL01', os: 'macOS', osVersion: 'macOS 15.0 Sequoia',
      complianceState: 'In grace period', lastCheckIn: randomDate(2), ownership: 'Personal',
      enrolledBy: 'Mike Williams', primaryUser: 'Mike Williams', joinType: 'Entra-registered',
      manufacturer: 'Apple', model: 'MacBook Air 13" (M3)', serialNumber: 'APL-MBA-' + randomInt(10000, 99999),
      enrolledDate: randomDate(14), managementState: 'Managed', category: 'BYOD',
      storageTotal: '512 GB', storageFree: '380 GB', isEncrypted: true, antivirusStatus: 'Not installed',
      defenderStatus: 'Not onboarded', lastSyncStatus: 'Success',
      noncompliantReasons: ['Microsoft Defender not installed'],
      graceDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  Store.setAll(Collections.DEVICES, devices);
}

/* ── Users ── */
function seedUsers() {
  Store.setAll(Collections.USERS, [
    {
      id: generateId(), displayName: 'Alex Johnson', email: 'alex.johnson@intunestudylab.com',
      role: 'Global Administrator', department: 'IT', jobTitle: 'IT Administrator',
      assignedDevices: 1, status: 'Active',
    },
    {
      id: generateId(), displayName: 'Sarah Chen', email: 'sarah.chen@intunestudylab.com',
      role: 'User', department: 'Design', jobTitle: 'UX Designer',
      assignedDevices: 4, status: 'Active',
    },
    {
      id: generateId(), displayName: 'Mike Williams', email: 'mike.williams@intunestudylab.com',
      role: 'Help Desk Operator', department: 'IT Support', jobTitle: 'Help Desk Analyst',
      assignedDevices: 3, status: 'Active',
    },
  ]);
}

/* ── Compliance Policies ── */
function seedCompliancePolicies() {
  Store.setAll(Collections.COMPLIANCE_POLICIES, [
    {
      id: generateId(), name: 'Windows Corporate Compliance', platform: 'Windows 10 and later',
      status: 'Active', assignedGroups: ['All corporate devices'], createdAt: randomDate(90),
      settings: {
        osMinVersion: '10.0.22621', requireEncryption: true, requireDefender: true,
        requireFirewall: true, passwordRequired: true, passwordMinLength: 8,
        maxMinutesInactive: 15,
      },
      actionsForNoncompliance: [
        { action: 'Mark device noncompliant', schedule: 'Immediately' },
        { action: 'Send email to end user', schedule: '1 day after' },
        { action: 'Retire device', schedule: '90 days after' },
      ],
    },
    {
      id: generateId(), name: 'iOS BYOD Compliance', platform: 'iOS/iPadOS',
      status: 'Active', assignedGroups: ['All personal iOS devices'], createdAt: randomDate(60),
      settings: {
        osMinVersion: '17.0', requireEncryption: true, jailbrokenBlocked: true,
        passwordRequired: true, passwordMinLength: 6, simplePasswordBlocked: true,
      },
      actionsForNoncompliance: [
        { action: 'Mark device noncompliant', schedule: '3 days after (grace period)' },
        { action: 'Send push notification', schedule: '3 days after' },
      ],
    },
    {
      id: generateId(), name: 'Android Enterprise Compliance', platform: 'Android Enterprise',
      status: 'Active', assignedGroups: ['All Android devices'], createdAt: randomDate(45),
      settings: {
        osMinVersion: '14.0', requireEncryption: true, rootedBlocked: true,
        requireGooglePlay: true, passwordRequired: true, passwordComplexity: 'High',
      },
      actionsForNoncompliance: [
        { action: 'Mark device noncompliant', schedule: 'Immediately' },
        { action: 'Send email to end user', schedule: '1 day after' },
      ],
    },
  ]);
}

/* ── Configuration Profiles ── */
function seedConfigProfiles() {
  Store.setAll(Collections.CONFIG_PROFILES, [
    {
      id: generateId(), name: 'Windows Security Baseline', platform: 'Windows 10 and later',
      profileType: 'Settings catalog', status: 'Active',
      assignedGroups: ['All corporate devices'], createdAt: randomDate(90),
      settings: [
        { category: 'Microsoft Defender Antivirus', name: 'Real-time protection', value: 'Enabled' },
        { category: 'Microsoft Defender Antivirus', name: 'Cloud-delivered protection', value: 'Enabled' },
        { category: 'BitLocker', name: 'Require device encryption', value: 'Yes' },
        { category: 'Firewall', name: 'Domain profile firewall', value: 'Enabled' },
        { category: 'User Rights', name: 'Deny log on locally', value: 'Guests' },
      ],
      scopeTags: ['Default'],
    },
    {
      id: generateId(), name: 'iOS Device Restrictions', platform: 'iOS/iPadOS',
      profileType: 'Settings catalog', status: 'Active',
      assignedGroups: ['All personal iOS devices'], createdAt: randomDate(60),
      settings: [
        { category: 'General', name: 'Block screenshots', value: 'Not configured' },
        { category: 'General', name: 'Block camera', value: 'Not configured' },
        { category: 'Cloud and Storage', name: 'Block iCloud backup', value: 'Yes (managed apps only)' },
        { category: 'Password', name: 'Require password', value: 'Yes' },
      ],
      scopeTags: ['Default'],
    },
    {
      id: generateId(), name: 'macOS FileVault Encryption', platform: 'macOS',
      profileType: 'Settings catalog', status: 'Active',
      assignedGroups: ['All corporate Mac devices'], createdAt: randomDate(30),
      settings: [
        { category: 'Full Disk Encryption - FileVault', name: 'Enable FileVault', value: 'Yes' },
        { category: 'Full Disk Encryption - FileVault', name: 'Escrow recovery key', value: 'Yes' },
        { category: 'Full Disk Encryption - FileVault', name: 'Number of times to allow bypass', value: '3' },
      ],
      scopeTags: ['Default'],
    },
  ]);
}

/* ── Apps ── */
function seedApps() {
  Store.setAll(Collections.APPS, [
    {
      id: generateId(), name: 'Microsoft Teams', type: 'Win32 app', platform: 'Windows',
      publisher: 'Microsoft Corporation', version: '24165.1505.3036.5765',
      status: 'Active', assignmentType: 'Required', installStatus: { installed: 9, failed: 1, pending: 2, notApplicable: 0 },
      assignedGroups: ['All corporate devices'], createdAt: randomDate(120),
      description: 'Microsoft Teams for desktop — chat, meetings, and collaboration.',
      size: '185 MB',
    },
    {
      id: generateId(), name: 'Microsoft 365 Apps for Enterprise', type: 'Microsoft 365 Apps',
      platform: 'Windows', publisher: 'Microsoft Corporation', version: 'Latest',
      status: 'Active', assignmentType: 'Required', installStatus: { installed: 8, failed: 0, pending: 2, notApplicable: 2 },
      assignedGroups: ['All corporate Windows devices'], createdAt: randomDate(150),
      description: 'Microsoft 365 Apps including Word, Excel, PowerPoint, Outlook, and more.',
      size: '2.1 GB', deploymentConfig: { updateChannel: 'Monthly Enterprise', excludeApps: ['Access', 'Publisher'] },
    },
    {
      id: generateId(), name: 'Company Portal', type: 'Store app', platform: 'Windows',
      publisher: 'Microsoft Corporation', version: '11.2.92.0',
      status: 'Active', assignmentType: 'Required', installStatus: { installed: 12, failed: 0, pending: 0, notApplicable: 0 },
      assignedGroups: ['All devices'], createdAt: randomDate(200),
      description: 'Intune Company Portal app for device enrollment and self-service.',
      size: '45 MB',
    },
    {
      id: generateId(), name: 'Slack', type: 'Win32 app', platform: 'Windows',
      publisher: 'Slack Technologies', version: '4.39.89',
      status: 'Active', assignmentType: 'Available', installStatus: { installed: 5, failed: 0, pending: 0, notApplicable: 7 },
      assignedGroups: ['All users'], createdAt: randomDate(60),
      description: 'Slack — team communication and collaboration platform.',
      size: '120 MB',
    },
    {
      id: generateId(), name: 'Zoom Workplace', type: 'LOB app', platform: 'Windows',
      publisher: 'Zoom Video Communications', version: '6.0.10',
      status: 'Active', assignmentType: 'Available', installStatus: { installed: 3, failed: 1, pending: 0, notApplicable: 8 },
      assignedGroups: ['All users'], createdAt: randomDate(30),
      description: 'Zoom Workplace — video conferencing and online meetings.',
      size: '95 MB',
    },
  ]);
}

/* ── Roles ── */
function seedRoles() {
  Store.setAll(Collections.ROLES, [
    {
      id: generateId(), name: 'Help Desk Operator', type: 'Built-in',
      description: 'Can perform remote tasks on users and devices and assign apps/policies.',
      members: ['Mike Williams'],
      permissions: {
        'Managed devices': ['Read', 'Update', 'Remote tasks'],
        'Managed apps': ['Read', 'Assign'],
        'Mobile apps': ['Read'],
        'Organization': ['Read'],
      },
    },
    {
      id: generateId(), name: 'Endpoint Security Manager', type: 'Built-in',
      description: 'Manages security and compliance features such as security baselines, device compliance, conditional access, and Defender for Endpoint.',
      members: ['Alex Johnson'],
      permissions: {
        'Managed devices': ['Read', 'Update', 'Delete', 'Remote tasks'],
        'Security baselines': ['Read', 'Create', 'Update', 'Delete', 'Assign'],
        'Compliance policies': ['Read', 'Create', 'Update', 'Delete', 'Assign'],
        'Device configurations': ['Read'],
        'Organization': ['Read'],
      },
    },
    {
      id: generateId(), name: 'Policy and Profile Manager', type: 'Built-in',
      description: 'Manages compliance policies, configuration profiles, Apple enrollment, corporate device identifiers, and security baselines.',
      members: ['Alex Johnson'],
      permissions: {
        'Compliance policies': ['Read', 'Create', 'Update', 'Delete', 'Assign'],
        'Device configurations': ['Read', 'Create', 'Update', 'Delete', 'Assign'],
        'Enrollment programs': ['Read', 'Create', 'Update', 'Delete'],
        'Security baselines': ['Read', 'Create', 'Update', 'Delete', 'Assign'],
        'Organization': ['Read'],
      },
    },
  ]);
}

/* ── Scope Tags ── */
function seedScopeTags() {
  Store.setAll(Collections.SCOPE_TAGS, [
    { id: generateId(), name: 'Default', description: 'Default scope tag — applied to all objects', isDefault: true, createdAt: randomDate(365) },
    { id: generateId(), name: 'US-East', description: 'Scope tag for US East region offices', isDefault: false, createdAt: randomDate(90) },
    { id: generateId(), name: 'EU-West', description: 'Scope tag for European West region', isDefault: false, createdAt: randomDate(90) },
  ]);
}

/* ── Scripts ── */
function seedScripts() {
  Store.setAll(Collections.SCRIPTS, [
    {
      id: generateId(), name: 'Set Timezone Script', platform: 'Windows',
      type: 'PowerShell', status: 'Active', assignedGroups: ['All corporate devices'],
      scriptContent: `# Set timezone to Eastern Standard Time\nSet-TimeZone -Id "Eastern Standard Time"\nWrite-Output "Timezone set successfully."`,
      runAsAccount: 'System', enforceSignatureCheck: false, runIn64BitHost: true,
      createdAt: randomDate(30),
      runHistory: [
        { device: 'DESKTOP-WIN01', status: 'Success', lastRun: randomDate(1) },
        { device: 'LAPTOP-WIN04', status: 'Success', lastRun: randomDate(1) },
        { device: 'DESKTOP-WIN02', status: 'Failed', lastRun: randomDate(2), error: 'Access denied' },
      ],
    },
    {
      id: generateId(), name: 'Clear Teams Cache', platform: 'Windows',
      type: 'Remediation', status: 'Active', assignedGroups: ['All corporate devices'],
      detectionScript: `# Detection: Check if Teams cache is over 500MB\n$cachePath = "$env:APPDATA\\Microsoft\\Teams"\nif (Test-Path $cachePath) {\n  $size = (Get-ChildItem $cachePath -Recurse | Measure-Object Length -Sum).Sum / 1MB\n  if ($size -gt 500) { Write-Output "Cache too large: $([math]::Round($size))MB"; exit 1 }\n}\nWrite-Output "Cache OK"; exit 0`,
      remediationScript: `# Remediation: Clear Teams cache\n$cachePath = "$env:APPDATA\\Microsoft\\Teams\\Cache"\nif (Test-Path $cachePath) {\n  Remove-Item "$cachePath\\*" -Recurse -Force\n  Write-Output "Cache cleared successfully."\n}`,
      runAsAccount: 'User', createdAt: randomDate(15),
      runHistory: [
        { device: 'DESKTOP-WIN01', status: 'Detected & Remediated', lastRun: randomDate(0) },
        { device: 'LAPTOP-WIN05', status: 'No issue detected', lastRun: randomDate(1) },
      ],
    },
  ]);
}

/* ── Autopilot Profiles ── */
function seedAutopilotProfiles() {
  Store.setAll(Collections.AUTOPILOT_PROFILES, [
    {
      id: generateId(), name: 'Corporate User-Driven Profile', type: 'Deployment profile (classic)',
      deploymentMode: 'User-driven', joinType: 'Entra-joined',
      outOfBoxExperience: { hidePrivacy: true, hideEULA: true, hideChangeAccount: true, userAccountType: 'Standard' },
      assignedGroups: ['Autopilot devices'], createdAt: randomDate(120),
      description: 'Classic Autopilot deployment for user-driven Entra join. Requires hardware hash.',
      requiresHardwareHash: true,
    },
    {
      id: generateId(), name: 'Kiosk Self-Deploying Profile', type: 'Deployment profile (classic)',
      deploymentMode: 'Self-deploying', joinType: 'Entra-joined',
      outOfBoxExperience: { hidePrivacy: true, hideEULA: true, hideChangeAccount: true, userAccountType: 'Standard' },
      assignedGroups: ['Kiosk devices'], createdAt: randomDate(90),
      description: 'Self-deploying mode for shared/kiosk devices. No user interaction required. Requires TPM 2.0.',
      requiresHardwareHash: true,
    },
    {
      id: generateId(), name: 'Device Prep - Standard Enrollment', type: 'Device preparation (v2)',
      deploymentMode: 'User-driven', joinType: 'Entra-joined',
      namingTemplate: 'CORP-%SERIAL%', appsToInstall: 10, scriptsToRun: 5,
      assignedGroups: ['All new devices'], createdAt: randomDate(14),
      description: 'Windows Autopilot device preparation policy (v2). No hardware hash required. Enrollment-time group assignment.',
      requiresHardwareHash: false,
      enrollmentTimeGroupTag: 'Standard-Corp',
    },
  ]);
}

export function seedAutopilotDevices() {
  if (Store.getAll(Collections.AUTOPILOT_DEVICES).length > 0) return;
  Store.setAll(Collections.AUTOPILOT_DEVICES, [
    {
      id: generateId(),
      serialNumber: 'AP-DL-774921',
      productKey: '00329-00000-00003-AAOEM',
      model: 'Latitude 5540',
      manufacturer: 'Dell Inc.',
      assignedProfile: 'Corporate User-Driven Profile',
      profileStatus: 'Assigned',
      associatedUser: 'Sarah Chen (sarah@contoso.com)',
      groupTag: 'Corp-Finance',
      purchaseOrder: 'PO-99401',
      lastSynced: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: generateId(),
      serialNumber: 'AP-LN-883012',
      productKey: '00330-80000-00000-AAOEM',
      model: 'ThinkPad T14 Gen 4',
      manufacturer: 'Lenovo',
      assignedProfile: 'Corporate User-Driven Profile',
      profileStatus: 'Assigned',
      associatedUser: 'Mike Williams (mike@contoso.com)',
      groupTag: 'Corp-Engineering',
      purchaseOrder: 'PO-99401',
      lastSynced: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: generateId(),
      serialNumber: 'AP-HP-109283',
      productKey: '00331-10000-00001-AAOEM',
      model: 'EliteBook 840 G10',
      manufacturer: 'HP',
      assignedProfile: 'Kiosk Self-Deploying Profile',
      profileStatus: 'Assigned',
      associatedUser: 'Unassigned',
      groupTag: 'Kiosk-Lobby',
      purchaseOrder: 'PO-88210',
      lastSynced: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: generateId(),
      serialNumber: 'AP-SF-552190',
      productKey: '00329-10000-00002-AAOEM',
      model: 'Surface Pro 10',
      manufacturer: 'Microsoft Corporation',
      assignedProfile: 'Unassigned',
      profileStatus: 'Not assigned',
      associatedUser: 'Alex Johnson (alex@contoso.com)',
      groupTag: 'Executive',
      purchaseOrder: 'PO-99500',
      lastSynced: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    }
  ]);
}

/* ── Security Baselines ── */
function seedSecurityBaselines() {
  Store.setAll(Collections.SECURITY_BASELINES, [
    {
      id: generateId(), name: 'Windows 11 Security Baseline (23H2)', status: 'Active',
      version: '23H2 - November 2023', assignedGroups: ['All corporate Windows devices'],
      settingsCount: 287, conflictCount: 2, errorCount: 0, createdAt: randomDate(90),
    },
    {
      id: generateId(), name: 'Microsoft Edge Security Baseline', status: 'Active',
      version: 'v117', assignedGroups: ['All corporate devices'],
      settingsCount: 45, conflictCount: 0, errorCount: 0, createdAt: randomDate(60),
    },
    {
      id: generateId(), name: 'Microsoft Defender for Endpoint Baseline', status: 'Active',
      version: 'December 2023', assignedGroups: ['All Defender-onboarded devices'],
      settingsCount: 63, conflictCount: 1, errorCount: 0, createdAt: randomDate(45),
    },
  ]);
}

/* ── Antivirus Policies ── */
function seedAntivirusPolicies() {
  Store.setAll(Collections.ANTIVIRUS_POLICIES, [
    {
      id: generateId(), name: 'Corporate Antivirus Policy', platform: 'Windows 10 and later',
      status: 'Active', assignedGroups: ['All corporate devices'], createdAt: randomDate(90),
      settings: { realTimeProtection: true, cloudProtection: true, sampleSubmission: 'Safe samples', scanSchedule: 'Weekly - Sunday 2:00 AM' },
    },
  ]);
}

/* ── Firewall Policies ── */
function seedFirewallPolicies() {
  Store.setAll(Collections.FIREWALL_POLICIES, [
    {
      id: generateId(), name: 'Corporate Firewall Rules', platform: 'Windows 10 and later',
      status: 'Active', assignedGroups: ['All corporate devices'], createdAt: randomDate(90),
      settings: { domainProfile: 'Enabled', privateProfile: 'Enabled', publicProfile: 'Enabled', blockInbound: true },
    },
  ]);
}

/* ── Disk Encryption ── */
function seedDiskEncryptionPolicies() {
  Store.setAll(Collections.DISK_ENCRYPTION_POLICIES, [
    {
      id: generateId(), name: 'BitLocker Corporate Policy', platform: 'Windows 10 and later',
      encryptionType: 'BitLocker', status: 'Active',
      assignedGroups: ['All corporate Windows devices'], createdAt: randomDate(120),
      settings: { requireEncryption: true, encryptionMethod: 'XTS-AES 256', startupAuth: 'TPM only', escrowRecoveryKey: true },
    },
    {
      id: generateId(), name: 'FileVault macOS Policy', platform: 'macOS',
      encryptionType: 'FileVault', status: 'Active',
      assignedGroups: ['All corporate Mac devices'], createdAt: randomDate(60),
      settings: { enableFileVault: true, escrowRecoveryKey: true, allowDeferral: true, maxDeferrals: 3 },
    },
  ]);
}

/* ── Update Rings ── */
function seedUpdateRings() {
  Store.setAll(Collections.UPDATE_RINGS, [
    {
      id: generateId(), name: 'Standard Update Ring', status: 'Active',
      assignedGroups: ['All corporate Windows devices'], createdAt: randomDate(180),
      settings: { qualityDeferral: 7, featureDeferral: 30, maintenanceWindow: 'Saturday 2:00 AM - 6:00 AM', autoRestart: true, deadlineDays: 5 },
    },
    {
      id: generateId(), name: 'Fast Ring (IT Pilot)', status: 'Active',
      assignedGroups: ['IT pilot group'], createdAt: randomDate(180),
      settings: { qualityDeferral: 0, featureDeferral: 0, maintenanceWindow: 'Any time', autoRestart: true, deadlineDays: 2 },
    },
  ]);
}

/* ── App Protection Policies ── */
function seedAppProtectionPolicies() {
  Store.setAll(Collections.APP_PROTECTION_POLICIES, [
    {
      id: generateId(), name: 'iOS MAM Policy', platform: 'iOS/iPadOS',
      status: 'Active', assignedGroups: ['All users'], createdAt: randomDate(90),
      protectedApps: ['Microsoft Outlook', 'Microsoft Teams', 'Microsoft OneDrive'],
      dataProtection: { preventBackup: true, encryptAppData: true, blockCopyPaste: 'Managed apps only', blockScreenCapture: false },
      accessRequirements: { pinRequired: true, pinLength: 6, biometricAuth: true, offlineGracePeriod: '720 minutes' },
    },
    {
      id: generateId(), name: 'Android MAM Policy', platform: 'Android',
      status: 'Active', assignedGroups: ['All users'], createdAt: randomDate(60),
      protectedApps: ['Microsoft Outlook', 'Microsoft Teams', 'Microsoft OneDrive', 'Microsoft Word'],
      dataProtection: { preventBackup: true, encryptAppData: true, blockCopyPaste: 'Managed apps only', blockScreenCapture: true },
      accessRequirements: { pinRequired: true, pinLength: 6, biometricAuth: true, offlineGracePeriod: '720 minutes' },
    },
  ]);
}

/* ── Conditional Access (Read-only mock) ── */
function seedConditionalAccess() {
  Store.setAll(Collections.CONDITIONAL_ACCESS, [
    {
      id: generateId(), name: 'Require compliant device for Office 365', status: 'On',
      conditions: { apps: ['Office 365'], platforms: ['All'], locations: ['Any'] },
      grantControls: ['Require device to be marked as compliant'],
      note: 'This is a read-only view. Conditional Access policies are managed in Microsoft Entra admin center.',
    },
    {
      id: generateId(), name: 'Block legacy authentication', status: 'On',
      conditions: { apps: ['All cloud apps'], clientApps: ['Exchange ActiveSync', 'Other clients'] },
      grantControls: ['Block access'],
      note: 'This is a read-only view. Conditional Access policies are managed in Microsoft Entra admin center.',
    },
    {
      id: generateId(), name: 'Require MFA for administrators', status: 'On',
      conditions: { apps: ['All cloud apps'], users: ['Directory roles: Global admin, Security admin'] },
      grantControls: ['Require multifactor authentication'],
      note: 'This is a read-only view. Conditional Access policies are managed in Microsoft Entra admin center.',
    },
  ]);
}

/* ── Alerts ── */
function seedAlerts() {
  Store.setAll(Collections.ALERTS, [
    {
      id: generateId(), title: 'Compliance drift detected', severity: 'High',
      category: 'Compliance', status: 'Active', createdAt: randomDate(1),
      description: 'Device DESKTOP-WIN02 has been noncompliant for 15 days — encryption is not enabled and OS version is below minimum.',
      affectedDevice: 'DESKTOP-WIN02', rule: 'Compliance drift > 14 days',
    },
    {
      id: generateId(), title: 'App installation failure', severity: 'Medium',
      category: 'Apps', status: 'Active', createdAt: randomDate(2),
      description: 'Zoom Workplace installation failed on DESKTOP-WIN02 with error code 0x80070005 (Access Denied).',
      affectedDevice: 'DESKTOP-WIN02', rule: 'App install failure',
    },
    {
      id: generateId(), title: 'Enrollment failure', severity: 'Low',
      category: 'Enrollment', status: 'Resolved', createdAt: randomDate(5),
      description: 'Enrollment attempt for device SN:HP-PAV-54321 failed due to device limit restriction (max 5 devices).',
      affectedDevice: 'N/A', rule: 'Enrollment failure',
    },
    {
      id: generateId(), title: 'Security baseline conflict', severity: 'Medium',
      category: 'Security', status: 'Active', createdAt: randomDate(3),
      description: '2 settings in the Windows 11 Security Baseline conflict with custom configuration profiles. Review and resolve conflicts.',
      affectedDevice: 'Multiple', rule: 'Baseline setting conflict',
    },
  ]);
}

/* ── Notifications ── */
function seedNotifications() {
  Store.setAll(Collections.NOTIFICATIONS, [
    {
      id: generateId(), type: 'warning', title: 'Compliance drift detected',
      message: 'DESKTOP-WIN02 has been noncompliant for 15 days.', read: false,
      timestamp: randomDate(0), actionUrl: '#/devices/all',
    },
    {
      id: generateId(), type: 'error', title: 'App installation failure',
      message: 'Zoom Workplace failed to install on 1 device.', read: false,
      timestamp: randomDate(1), actionUrl: '#/apps',
    },
    {
      id: generateId(), type: 'info', title: 'Service health update',
      message: 'Microsoft Intune service maintenance completed successfully.', read: true,
      timestamp: randomDate(2), actionUrl: '#/tenant/service-health',
    },
    {
      id: generateId(), type: 'success', title: 'Policy deployed',
      message: 'Windows Corporate Compliance policy applied to 9 of 9 targeted devices.', read: true,
      timestamp: randomDate(3), actionUrl: '#/devices/compliance-policies',
    },
  ]);
}

/* ── Incidents (Defender mock) ── */
function seedIncidents() {
  Store.setAll(Collections.INCIDENTS, [
    {
      id: generateId(), title: 'Suspicious PowerShell execution', severity: 'High',
      status: 'Active', category: 'Execution', device: 'DESKTOP-WIN02',
      user: 'Mike Williams', detectedAt: randomDate(1),
      description: 'PowerShell process launched with encoded command — potential malicious script execution detected by EDR.',
    },
    {
      id: generateId(), title: 'Phishing email link clicked', severity: 'Medium',
      status: 'Investigating', category: 'Initial access', device: 'IPHONE-MIKE',
      user: 'Mike Williams', detectedAt: randomDate(3),
      description: 'User clicked a link in a phishing email. URL blocked by SmartScreen but interaction was logged.',
    },
    {
      id: generateId(), title: 'Anomalous sign-in location', severity: 'Low',
      status: 'Resolved', category: 'Credential access', device: 'LAPTOP-WIN04',
      user: 'Alex Johnson', detectedAt: randomDate(7),
      description: 'Sign-in from an unusual geographic location detected. User confirmed legitimate travel.',
    },
  ]);
}

/* ── Connectors ── */
function seedConnectors() {
  Store.setAll(Collections.CONNECTORS, [
    { id: generateId(), name: 'Microsoft Defender for Endpoint', status: 'Connected', type: 'Security', lastSync: randomDate(0) },
    { id: generateId(), name: 'Apple Push Notification Service (APNs)', status: 'Connected', type: 'Enrollment', lastSync: randomDate(0), expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
    { id: generateId(), name: 'Google Play (Android Enterprise)', status: 'Connected', type: 'Enrollment', lastSync: randomDate(0) },
    { id: generateId(), name: 'Certificate Connector', status: 'Disconnected', type: 'Infrastructure', lastSync: randomDate(30), error: 'Connection timeout' },
    { id: generateId(), name: 'TeamViewer Connector', status: 'Not configured', type: 'Remote assistance', lastSync: null },
  ]);
}

/* ── ESP Config ── */
function seedESPConfigs() {
  Store.setAll(Collections.ESP_CONFIGS, [
    {
      id: generateId(), name: 'Default ESP', isDefault: true, status: 'Active',
      showAppInstallProgress: true, showProfileInstallProgress: true,
      blockDeviceUseUntilComplete: true, allowFailureAndContinue: false,
      timeoutMinutes: 60, customErrorMessage: '',
      trackApps: ['Microsoft 365 Apps for Enterprise', 'Microsoft Teams', 'Company Portal'],
      assignedGroups: ['All devices'], createdAt: randomDate(120),
    },
  ]);
}

/* ── Windows Hello for Business ── */
function seedHelloPolicies() {
  Store.setAll(Collections.HELLO_POLICIES, [
    {
      id: generateId(), name: 'Corporate WHfB Policy', status: 'Active',
      assignedGroups: ['All corporate devices'], createdAt: randomDate(90),
      settings: {
        enabled: true, useTpm: true, pinMinLength: 6, pinMaxLength: 127,
        pinUppercase: 'Allowed', pinLowercase: 'Allowed', pinSpecial: 'Allowed',
        biometric: true, enhancedAntiSpoofing: true,
      },
    },
  ]);
}

/* ── LAPS Policies ── */
function seedLAPSPolicies() {
  Store.setAll(Collections.LAPS_POLICIES, [
    {
      id: generateId(), name: 'Corporate LAPS Policy', status: 'Active',
      assignedGroups: ['All corporate Windows devices'], createdAt: randomDate(60),
      settings: {
        backupDirectory: 'Microsoft Entra ID', passwordAge: 30,
        administratorAccountName: '', passwordComplexity: 'Large letters + small letters + numbers + special characters',
        passwordLength: 14, postAuthActions: 'Reset password and logoff',
        postAuthDelay: 24,
      },
    },
  ]);
}

/* ── Dynamic Groups ── */
function seedDynamicGroups() {
  Store.setAll(Collections.DYNAMIC_GROUPS, [
    {
      id: generateId(), name: 'All Windows Devices', type: 'Dynamic device',
      rule: '(device.deviceOSType -eq "Windows")', memberCount: 5, createdAt: randomDate(180),
    },
    {
      id: generateId(), name: 'All Corporate Devices', type: 'Dynamic device',
      rule: '(device.deviceOwnership -eq "Company")', memberCount: 7, createdAt: randomDate(180),
    },
    {
      id: generateId(), name: 'All iOS BYOD Devices', type: 'Dynamic device',
      rule: '(device.deviceOSType -eq "iOS") -and (device.deviceOwnership -eq "Personal")', memberCount: 2, createdAt: randomDate(90),
    },
    {
      id: generateId(), name: 'Autopilot Devices', type: 'Dynamic device',
      rule: '(device.devicePhysicalIds -any _ -contains "[ZTDid]")', memberCount: 0, createdAt: randomDate(120),
    },
  ]);
}

/* ── Cloud PCs ── */
function seedCloudPCs() {
  Store.setAll(Collections.CLOUD_PCS, [
    {
      id: generateId(), name: 'CPC-SarahChen-01', status: 'Provisioned', user: 'Sarah Chen',
      spec: '4 vCPU / 16 GB / 256 GB', image: 'Windows 11 Enterprise + M365 Apps',
      region: 'East US', lastConnected: randomDate(0), provisioningPolicy: 'Standard Cloud PC',
    },
    {
      id: generateId(), name: 'CPC-MikeWilliams-01', status: 'Provisioned', user: 'Mike Williams',
      spec: '2 vCPU / 8 GB / 128 GB', image: 'Windows 11 Enterprise',
      region: 'East US', lastConnected: randomDate(2), provisioningPolicy: 'Basic Cloud PC',
    },
  ]);
}

/* ── Provisioning Policies (Windows 365) ── */
function seedProvisioningPolicies() {
  Store.setAll(Collections.PROVISIONING_POLICIES, [
    {
      id: generateId(), name: 'Standard Cloud PC', status: 'Active',
      joinType: 'Entra-joined', networkType: 'Microsoft hosted network', region: 'East US',
      imageType: 'Gallery', imageName: 'Windows 11 Enterprise + M365 Apps 24H2',
      spec: '4 vCPU / 16 GB / 256 GB', assignedGroups: ['Cloud PC users - Standard'],
      createdAt: randomDate(90),
    },
    {
      id: generateId(), name: 'Basic Cloud PC', status: 'Active',
      joinType: 'Entra-joined', networkType: 'Microsoft hosted network', region: 'East US',
      imageType: 'Gallery', imageName: 'Windows 11 Enterprise 24H2',
      spec: '2 vCPU / 8 GB / 128 GB', assignedGroups: ['Cloud PC users - Basic'],
      createdAt: randomDate(60),
    },
  ]);
}

/* ── Audit Logs ── */
function seedAuditLogs() {
  Store.setAll(Collections.AUDIT_LOGS, [
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      activity: 'Rotate BitLocker recovery key',
      category: 'Device',
      activityType: 'Action',
      initiatedBy: 'admin@contoso.onmicrosoft.com',
      target: 'DESKTOP-WIN01',
      targetId: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
      result: 'Success',
      clientIp: '198.51.100.42',
      correlationId: 'b148c901-71e4-4df1-8931-1849a0294711',
      details: 'Triggered immediate BitLocker key rotation via Microsoft Graph MDM action.',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      activity: 'Create configuration profile',
      category: 'Policy',
      activityType: 'Create',
      initiatedBy: 'admin@contoso.onmicrosoft.com',
      target: 'Windows 11 Enterprise Baseline Policy',
      targetId: 'cfg-win11-base-01',
      result: 'Success',
      clientIp: '198.51.100.42',
      correlationId: '98a4120f-b2c3-41d9-9524-7f12e84c90a1',
      details: 'Created Settings Catalog profile assigned to All Corporate Windows Devices.',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      activity: 'Sync Managed Google Play connector',
      category: 'Connector',
      activityType: 'Action',
      initiatedBy: 'IntuneService@contoso.com',
      target: 'Managed Google Play enterprise binding',
      targetId: 'conn-mgp-001',
      result: 'Success',
      clientIp: '13.107.6.152',
      correlationId: 'c74901f2-10e8-4720-bf19-33829014ba81',
      details: 'Synchronized 18 Android Enterprise approved application catalogs.',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      activity: 'Assign application',
      category: 'Application',
      activityType: 'Update',
      initiatedBy: 'alex.johnson@contoso.com',
      target: 'Microsoft 365 Apps for Enterprise',
      targetId: 'app-m365-ent',
      result: 'Success',
      clientIp: '198.51.100.88',
      correlationId: 'd01824ab-991f-4bb2-b671-55829104fa23',
      details: 'Updated Required assignment group to include Finance Department.',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      activity: 'Rotate Windows LAPS password',
      category: 'Device',
      activityType: 'Action',
      initiatedBy: 'admin@contoso.onmicrosoft.com',
      target: 'DESKTOP-WIN02',
      targetId: '3fa85f64-5717-4562-b3fc-2c963f66afa2',
      result: 'Success',
      clientIp: '198.51.100.42',
      correlationId: 'e481029c-a110-47cb-bc20-994102941fa9',
      details: 'Forced local administrator password expiration and Entra ID escrow re-encryption.',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      activity: 'Update device platform restrictions',
      category: 'Enrollment',
      activityType: 'Update',
      initiatedBy: 'admin@contoso.onmicrosoft.com',
      target: 'Default Platform Restriction Policy',
      targetId: 'restr-default-01',
      result: 'Success',
      clientIp: '198.51.100.42',
      correlationId: 'f9201948-2831-419b-a010-8271049182ab',
      details: 'Blocked Android Personally Owned devices and set minimum Android OS to 10.0.',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      activity: 'Remote device wipe',
      category: 'Device',
      activityType: 'Action',
      initiatedBy: 'admin@contoso.onmicrosoft.com',
      target: 'LOST-LAPTOP-09',
      targetId: 'dev-lost-09',
      result: 'Failure',
      clientIp: '198.51.100.42',
      correlationId: '1029a81b-5510-4491-9921-2291048219ba',
      details: 'Device offline for >30 days. Wipe command queued in Microsoft Notification Service (WNS).',
    },
    {
      id: generateId(),
      activityDateTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      activity: 'Create attack surface reduction policy',
      category: 'Security',
      activityType: 'Create',
      initiatedBy: 'alex.johnson@contoso.com',
      target: 'ASR - Ransomware & LSASS Protection',
      targetId: 'asr-ransomware-01',
      result: 'Success',
      clientIp: '198.51.100.88',
      correlationId: '772901a8-c990-410a-ba10-6619028471da',
      details: 'Enforced LSASS credential stealing block and child processes of Office applications block.',
    },
  ]);
}

/* ── Company Portal Customization ── */
function seedCustomization() {
  Store.create(Collections.CUSTOMIZATION, {
    id: 'tenant_branding',
    orgName: 'Contoso Corporation',
    accentColor: '#0078D4',
    showLogo: true,
    contactName: 'Contoso IT Helpdesk',
    contactPhone: '+1 (800) 555-0199',
    contactEmail: 'ithelpdesk@contoso.com',
    supportWebUrl: 'https://helpdesk.contoso.com',
    additionalInfo: 'For urgent device lockouts, BitLocker PIN resets, or lost hardware, call the 24/7 hotline directly.',
    privacyUrl: 'https://contoso.com/privacy',
    updatedAt: new Date().toISOString(),
  });
}

