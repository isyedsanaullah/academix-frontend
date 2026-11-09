/**
 * Deterministic fixed-point resolution matching backend algorithm
 */

export const PLAN_FEATURES = {
  starter: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
  ],
  basic: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
  ],
  standard: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
    'fees',
    'entry-system',
    'visitors',
    'employees',
    'canteen',
    'analytics-reports',
    'analytics',
    'reports',
    'advanced',
  ],
  premium: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
    'fees',
    'entry-system',
    'visitors',
    'employees',
    'canteen',
    'analytics-reports',
    'analytics',
    'reports',
    'advanced',
    'ai-chat',
    'ai-pdf-chat',
    'ai-generators',
    'ai-study-assistant',
    'ai-paper-generator',
    'ai-quiz-generator',
    'ai-assignment-generator',
    'ai-notes-generator',
    'ai-syllabus-generator',
    'ai-mcq-generator',
  ],
  enterprise: [
    'core-academic',
    'students',
    'teachers',
    'subjects',
    'classes',
    'sections',
    'sessions',
    'attendance',
    'timetable',
    'exams-results',
    'exams',
    'results',
    'assignments-quizzes',
    'assignments',
    'quizzes',
    'certificates',
    'announcements',
    'notices',
    'fees',
    'entry-system',
    'visitors',
    'employees',
    'canteen',
    'analytics-reports',
    'analytics',
    'reports',
    'advanced',
    'ai-chat',
    'ai-pdf-chat',
    'ai-generators',
    'ai-study-assistant',
    'ai-paper-generator',
    'ai-quiz-generator',
    'ai-assignment-generator',
    'ai-notes-generator',
    'ai-syllabus-generator',
    'ai-mcq-generator',
    'custom-roles',
    'audit-logs',
    'multi-campus',
    'api-access',
  ],
};

export function computeReactiveFeatureMatrix(planId, baseRegistry, overrides = {}) {
  const cleanPlan = (planId || 'starter').toLowerCase().trim();
  const planKey = cleanPlan.startsWith('ent')
    ? 'enterprise'
    : cleanPlan.startsWith('prem')
    ? 'premium'
    : cleanPlan.startsWith('stand')
    ? 'standard'
    : 'starter';
  const planAllowed = PLAN_FEATURES[planKey] || PLAN_FEATURES.starter;
  const stateMap = new Map();

  for (const feat of baseRegistry) {
    const inPlan = planAllowed.includes(feat.key);
    const rawOverride = overrides[feat.key];
    let override = null;

    if (rawOverride === true || rawOverride === 'true' || (typeof rawOverride === 'object' && rawOverride?.state === 'on')) {
      if (typeof rawOverride === 'object' && rawOverride?.expiresAt && new Date(rawOverride.expiresAt).getTime() <= Date.now()) {
        override = null; // Expired override reverts to plan default
      } else {
        override = true;
      }
    } else if (rawOverride === false || rawOverride === 'false' || (typeof rawOverride === 'object' && rawOverride?.state === 'off')) {
      if (typeof rawOverride === 'object' && rawOverride?.expiresAt && new Date(rawOverride.expiresAt).getTime() <= Date.now()) {
        override = null; // Expired override reverts to plan default
      } else {
        override = false;
      }
    }

    if (feat.isCore) {
      stateMap.set(feat.key, {
        ...feat,
        inPlan: true,
        override: null,
        rawOverride,
        effective: true,
        dependencyBlocked: false,
        blockedBy: [],
        source: 'core_foundation'
      });
      continue;
    }

    let effective = inPlan;
    let source = inPlan ? 'plan_default' : 'plan_default';

    if (override === true) {
      effective = true;
      source = inPlan ? 'plan_default' : 'custom_enabled';
    } else if (override === false) {
      effective = false;
      source = 'custom_disabled';
    } else {
      effective = inPlan;
      source = 'plan_default';
    }

    stateMap.set(feat.key, {
      ...feat,
      inPlan,
      override,
      rawOverride,
      effective,
      dependencyBlocked: false,
      blockedBy: [],
      source
    });
  }

  // Deterministic fixed-point propagation
  let changed = true;
  let iterations = 0;
  const maxIterations = baseRegistry.length * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const feat of baseRegistry) {
      const current = stateMap.get(feat.key);
      if (!current || current.isCore) continue;

      if (current.effective && feat.dependsOn && feat.dependsOn.length > 0) {
        const missingDeps = [];
        for (const depKey of feat.dependsOn) {
          const depState = stateMap.get(depKey);
          if (!depState || !depState.effective) {
            missingDeps.push(depKey);
          }
        }

        if (missingDeps.length > 0) {
          current.effective = false;
          current.dependencyBlocked = true;
          current.blockedBy = missingDeps;
          current.source = 'dependency_blocked';
          changed = true;
        }
      }
    }
  }

  return Array.from(stateMap.values());
}

