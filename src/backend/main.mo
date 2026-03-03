import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Analysis history
  type AnalysisRecord = {
    id : Nat;
    user : Principal;
    analysisName : Text;
    tableName : Text;
    healthScore : Nat;
    grade : Text;
    violationsSummary : Text;
    generatedSQL : Text;
    createdAt : Time.Time;
  };

  module AnalysisRecord {
    public func compareByCreatedAt(a : AnalysisRecord, b : AnalysisRecord) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  var nextAnalysisId = 0;
  let analysisRecords = Map.empty<Nat, AnalysisRecord>();

  public shared ({ caller }) func saveAnalysis(
    analysisName : Text,
    tableName : Text,
    healthScore : Nat,
    grade : Text,
    violationsSummary : Text,
    generatedSQL : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save analyses");
    };

    let record : AnalysisRecord = {
      id = nextAnalysisId;
      user = caller;
      analysisName;
      tableName;
      healthScore;
      grade;
      violationsSummary;
      generatedSQL;
      createdAt = Time.now();
    };

    analysisRecords.add(nextAnalysisId, record);
    nextAnalysisId += 1;
    record.id;
  };

  public query ({ caller }) func getMyAnalyses() : async [AnalysisRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve analyses");
    };

    analysisRecords.values().toArray().filter(
      func(record : AnalysisRecord) : Bool { record.user == caller }
    ).sort(AnalysisRecord.compareByCreatedAt);
  };

  public query ({ caller }) func getAnalysisById(id : Nat) : async ?AnalysisRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve analyses");
    };

    switch (analysisRecords.get(id)) {
      case (?record) {
        if (record.user == caller) { ?record } else { null };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func deleteAnalysis(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete analyses");
    };

    switch (analysisRecords.get(id)) {
      case (?record) {
        if (record.user != caller) {
          Runtime.trap("Unauthorized: Can only delete your own analyses");
        };
        analysisRecords.remove(id);
      };
      case (null) { () };
    };
  };

  public query ({ caller }) func getAllAnalyses() : async [AnalysisRecord] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can retrieve all analyses");
    };

    analysisRecords.values().toArray();
  };
};
