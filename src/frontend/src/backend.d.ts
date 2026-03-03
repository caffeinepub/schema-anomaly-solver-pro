import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export interface AnalysisRecord {
    id: bigint;
    generatedSQL: string;
    analysisName: string;
    createdAt: Time;
    user: Principal;
    grade: string;
    tableName: string;
    healthScore: bigint;
    violationsSummary: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAnalysis(id: bigint): Promise<void>;
    getAllAnalyses(): Promise<Array<AnalysisRecord>>;
    getAnalysisById(id: bigint): Promise<AnalysisRecord | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyAnalyses(): Promise<Array<AnalysisRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveAnalysis(analysisName: string, tableName: string, healthScore: bigint, grade: string, violationsSummary: string, generatedSQL: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
