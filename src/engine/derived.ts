export const calculateValueOfCar = (exShowroomPrice: number, registrationCharge: number, insurance: number): number =>
  exShowroomPrice + registrationCharge + insurance

export const calculateLTV = (loanAmount: number, valueOfCar: number): number =>
  valueOfCar > 0 ? (loanAmount / valueOfCar) * 100 : 0

export const calculateEmiNmiRatio = (emi: number, nmi: number): number => (nmi > 0 ? (emi / nmi) * 100 : Infinity)
