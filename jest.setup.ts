import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
