"use client";

import { useEffect, useId, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCities, fetchCountries, fetchStates } from "@/lib/geo-lookup";

interface LocationFieldsProps {
  country: string;
  state: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  countryError?: string;
  stateError?: string;
  cityError?: string;
}

/**
 * Live, cascading Country → State → City selects (countriesnow.space —
 * no API key). Shared across every form that captures an address, so the
 * behavior (loading states, clearing downstream selections when an
 * upstream one changes) only needs to be right in one place.
 */
export function LocationFields({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  disabled,
  countryError,
  stateError,
  cityError,
}: LocationFieldsProps) {
  const countryId = useId();
  const stateId = useId();
  const cityId = useId();

  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [countriesFailed, setCountriesFailed] = useState(false);
  const [statesFailed, setStatesFailed] = useState(false);
  const [citiesFailed, setCitiesFailed] = useState(false);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => setCountriesFailed(true))
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    if (!country) {
      setStates([]);
      return;
    }
    setLoadingStates(true);
    setStatesFailed(false);
    fetchStates(country)
      .then(setStates)
      .catch(() => setStatesFailed(true))
      .finally(() => setLoadingStates(false));
  }, [country]);

  useEffect(() => {
    if (!country || !state) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    setCitiesFailed(false);
    fetchCities(country, state)
      .then(setCities)
      .catch(() => setCitiesFailed(true))
      .finally(() => setLoadingCities(false));
  }, [country, state]);

  const handleCountryChange = (value: string) => {
    onCountryChange(value);
    onStateChange("");
    onCityChange("");
  };

  const handleStateChange = (value: string) => {
    onStateChange(value);
    onCityChange("");
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={countryId}>Country</Label>
        <Select
          value={country}
          onValueChange={(value) => handleCountryChange(value ?? "")}
          disabled={disabled || loadingCountries}
        >
          <SelectTrigger
            id={countryId}
            className="h-11 w-full"
            aria-invalid={!!countryError}
          >
            <SelectValue
              placeholder={
                loadingCountries ? "Loading countries…" : "Select country"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {countries.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          message={
            countryError ??
            (countriesFailed
              ? "Couldn't load the country list — check your connection."
              : undefined)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={stateId}>State</Label>
        <Select
          value={state}
          onValueChange={(value) => handleStateChange(value ?? "")}
          disabled={disabled || !country || loadingStates}
        >
          <SelectTrigger
            id={stateId}
            className="h-11 w-full"
            aria-invalid={!!stateError}
          >
            <SelectValue
              placeholder={
                !country
                  ? "Select a country first"
                  : loadingStates
                    ? "Loading states…"
                    : "Select state"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {states.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          message={
            stateError ??
            (statesFailed ? `Couldn't load states for ${country}.` : undefined)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={cityId}>City / Local Government</Label>
        <Select
          value={city}
          onValueChange={(value) => onCityChange(value ?? "")}
          disabled={disabled || !state || loadingCities}
        >
          <SelectTrigger
            id={cityId}
            className="h-11 w-full"
            aria-invalid={!!cityError}
          >
            <SelectValue
              placeholder={
                !state
                  ? "Select a state first"
                  : loadingCities
                    ? "Loading cities…"
                    : "Select city"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {cities.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          message={
            cityError ??
            (citiesFailed ? `Couldn't load cities for ${state}.` : undefined)
          }
        />
      </div>
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
