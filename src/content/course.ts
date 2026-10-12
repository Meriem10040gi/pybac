import { u1 } from './bases/u1-variables';
import { u2 } from './bases/u2-conditions';
import { u3 } from './bases/u3-for';
import { u4 } from './bases/u4-while';
import { u5 } from './bases/u5-fonctions';
import { u6 } from './bases/u6-listes';
import { u7 } from './bases/u7-parcours';
import { arbres } from './nsi/arbres';
import { binaire } from './nsi/binaire';
import { chaines } from './nsi/chaines';
import { dichotomie } from './nsi/dichotomie';
import { dictionnaires } from './nsi/dictionnaires';
import { diviser } from './nsi/diviser';
import { gloutons } from './nsi/gloutons';
import { graphes } from './nsi/graphes';
import { grilles } from './nsi/grilles';
import { pilesFiles } from './nsi/piles-files';
import { poo } from './nsi/poo';
import { pratique } from './nsi/pratique';
import { processus } from './nsi/processus';
import { recursivite } from './nsi/recursivite';
import { reseaux } from './nsi/reseaux';
import { securite } from './nsi/securite';
import { sqlUnit } from './nsi/sql';
import { testsBugs } from './nsi/tests';
import { tris } from './nsi/tris';
import type { Lesson, Module, Unit } from './types';

// Order of the ROADMAP (chapitres 0 à 11, puis l'épreuve pratique). Inside a module, lessons open one
// after the other; each module can be started on its own (see src/state/progress.tsx).
export const COURSE: Module[] = [
  {
    id: 'bases',
    title: 'Les bases',
    subtitle: 'Python et algorithmique depuis zéro',
    units: [u1, u2, u3, u4, u5, u6, u7],
  },
  {
    id: 'premiere',
    title: 'Compléments de Première',
    subtitle: 'Chapitre 0 : la fin de la remise à niveau',
    units: [chaines, dictionnaires, grilles, tris, dichotomie, binaire, testsBugs],
  },
  {
    id: 'programmer',
    title: 'Terminale : programmer',
    subtitle: 'Chapitres 1 à 3',
    units: [poo, recursivite, sqlUnit],
  },
  {
    id: 'structures',
    title: 'Terminale : structures de données',
    subtitle: 'Chapitres 4 à 6',
    units: [pilesFiles, arbres, graphes],
  },
  {
    id: 'algorithmes',
    title: 'Terminale : algorithmes',
    subtitle: 'Chapitres 7 et 8',
    units: [diviser, gloutons],
  },
  {
    id: 'systemes',
    title: 'Terminale : sécurité, réseaux, systèmes',
    subtitle: 'Chapitres 9 à 11',
    units: [securite, reseaux, processus],
  },
  {
    id: 'bac',
    title: 'Préparer le bac',
    subtitle: 'Épreuve pratique',
    units: [pratique],
  },
];

/** Every lesson in course order, with its unit. */
export const LESSONS: { lesson: Lesson; unit: Unit; module: Module }[] = COURSE.flatMap((module) =>
  module.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, unit, module }))),
);

export function findLesson(id: string) {
  return LESSONS.find((l) => l.lesson.id === id);
}

export function findUnit(id: string) {
  for (const m of COURSE) {
    const unit = m.units.find((u) => u.id === id);
    if (unit) return { unit, module: m };
  }
  return undefined;
}
