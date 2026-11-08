export interface ClientListDto {
    id: number;
    clientTypeId: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    taxNumber: string;
}
export interface ClientDetailDto {
    id: number;
    clientTypeId: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    taxNumber: string;
}
export interface ClientCreateDto {
    clientTypeId: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    taxNumber: string;
}
export interface ClientUpdateDto {
    clientTypeId: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    taxNumber: string;
}