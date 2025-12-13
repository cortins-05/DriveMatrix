export interface AutoListing {
  vin?: number;
  make:string,
  model:string,
  transmission:string,
  drivetrain: string;
  fuel: string;
  engine: string;
  doors: string | number;
  seats: string | number;
  location: string | number[];
}
