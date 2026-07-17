"use client";

import { createContext } from "react";
import type { JargoClient } from "@gojargo/jargo-client-js";

export const JargoClientContext = createContext<JargoClient | null>(null);
