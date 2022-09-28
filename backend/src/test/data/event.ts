import * as Domain from "../../domain";
import * as DomainEvent from "./domain-event";

export const createBuyIcecream: Domain.Event.Event = {
  id: "90128302-0",
  domainEvent: DomainEvent.createBuyIcecream,
};

export const createBuyMilk: Domain.Event.Event = {
  id: "10273012-14",
  domainEvent: DomainEvent.createBuyMilk,
};
