export interface AutoListing {
  vin?: string;
  make:string,
  model:string,
  transmission:string,
  drivetrain: string;
  fuel: string;
  engine: string;
  doors: string | number;
  seats: string | number;
  location?: number[];
  direction?: string
  price:number
}
