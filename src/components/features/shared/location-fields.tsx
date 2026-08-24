"use client";

import { useEffect, useId, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
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
 * upstream one changes) only needs to be right in one place. Searchable
 * (`Combobox`) rather than a plain `Select` — a country list alone runs to
 * ~195 entries, scrolling through that to find one is a bad experience.
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
        <Combobox
          id={countryId}
          value={country}
          onValueChange={handleCountryChange}
          options={countries.map((option) => ({
            value: option,
            label: option,
          }))}
          placeholder="Select country"
          searchPlaceholder="Search countries…"
          loading={loadingCountries}
          loadingText="Loading countries…"
          disabled={disabled}
          ariaInvalid={!!countryError}
        />
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
        <Combobox
          id={stateId}
          value={state}
          onValueChange={handleStateChange}
          options={states.map((option) => ({ value: option, label: option }))}
          placeholder={!country ? "Select a country first" : "Select state"}
          searchPlaceholder="Search states…"
          loading={loadingStates}
          loadingText="Loading states…"
          disabled={disabled || !country}
          ariaInvalid={!!stateError}
        />
        <FieldError
          message={
            stateError ??
            (statesFailed ? `Couldn't load states for ${country}.` : undefined)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={cityId}>City / Local Government</Label>
        <Combobox
          id={cityId}
          value={city}
          onValueChange={onCityChange}
          options={cities.map((option) => ({ value: option, label: option }))}
          placeholder={!state ? "Select a state first" : "Select city"}
          searchPlaceholder="Search cities…"
          loading={loadingCities}
          loadingText="Loading cities…"
          disabled={disabled || !state}
          ariaInvalid={!!cityError}
        />
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
