export interface BloodPressure {
  id: string;
  date: string;
  morning: {
    bp1: string;
    bp2: string;
    // bp1Sys: string;
    // bp1Dia: string;
    // bp1Pulse: string;
    // bp2Sys: string;
    // bp2Dia: string;
    // bp2Pulse: string;
  };
  evening: {
    bp1: string;
    bp2: string;
    // bp1Sys: string;
    // bp1Dia: string;
    // bp1Pulse: string;
    // bp2Sys: string;
    // bp2Dia: string;
    // bp2Pulse: string;
  };
}

export interface TimeOptions {
  name: string;
  code: string;
}
