import React, { useCallback, useMemo, useState } from 'react'

import { BuildingAttributes } from '../../../models/building';
import { FieldRow } from '../../data-components/field-row';
import DataEntry, { BaseDataEntryProps } from '../../data-components/data-entry';
import NumericDataEntry from '../../data-components/numeric-data-entry';
import { DataTitleCopyable } from '../../data-components/data-title';
import { dataFields } from '../../../config/data-fields-config';
import SelectDataEntry from '../../data-components/select-data-entry';
import MultiDataEntry from '../../data-components/multi-data-entry/multi-data-entry';

import './dynamics-data-entry.css';
import { NumberRangeDataEntry } from './number-range-data-entry';

const percentOverlapOption = ['25%', '50%', '75%', '100%'];

type PastBuilding = (BuildingAttributes['past_buildings'][number]);

export const DynamicsBuildingPane: React.FC<{className?: string}> = ({children, className}) => (
    <div className={`dynamics-building-pane ${className ?? ''}`} >
        {children}
    </div>
);

function difference(a: number, b: number): number {
    if(a == undefined || b == undefined) return undefined;

    return a - b;
}

function formatRange(minSpan: number, maxSpan: number): string {
    if(minSpan == undefined || maxSpan == undefined) return '';

    if(minSpan === maxSpan) return minSpan + '';

    return `${minSpan}-${maxSpan}`;
}

interface DynamicsDataRowProps {
    value: PastBuilding;
    onChange?: (value: PastBuilding) => void;
    disabled?: boolean;
    maxYear?: number;
    minYear?: number;
    mode?: 'view' | 'edit' | 'multi-edit';
    required?: boolean;
    validateForm?: boolean;
    index?: number;
}
const DynamicsDataRow: React.FC<DynamicsDataRowProps> = ({
    value = {} as PastBuilding,
    onChange,
    disabled = false,
    maxYear,
    minYear,
    mode,
    required = false,
    validateForm = false,
    index
}) => {

    const onFieldChange = useCallback((key: string, val: any) => {
        const changedValue = {...value};
        changedValue[key] = val;
        onChange(changedValue);
    }, [value, onChange]);


    console.log(value);
    const maxLifespan = difference(value.year_demolished?.max, value.year_constructed?.min);
    const minLifespan = difference(value.year_demolished?.min, value.year_constructed?.max);

    return (
        <>
            <FieldRow>
                <NumberRangeDataEntry
                    slug='year_constructed'
                    slugModifier={index}
                    title={dataFields.past_buildings.items.year_constructed.title}
                    onChange={onFieldChange}
                    value={value.year_constructed}
                    disabled={disabled}
                    max={value.year_demolished?.min ?? maxYear}
                    min={minYear}
                    placeholderMin='Earliest'
                    placeholderMax='Latest'
                    titleMin={`${dataFields.past_buildings.items.year_constructed.title}: earliest estimate`}
                    titleMax={`${dataFields.past_buildings.items.year_constructed.title}: latest estimate`}
                    required={required}
                />
                <NumberRangeDataEntry
                    slug='year_demolished'
                    slugModifier={index}
                    title={dataFields.past_buildings.items.year_demolished.title}
                    onChange={onFieldChange}
                    value={value.year_demolished}
                    disabled={disabled}
                    max={maxYear}
                    min={value.year_constructed?.max ?? minYear}
                    placeholderMin='Earliest'
                    placeholderMax='Latest'
                    titleMin={`${dataFields.past_buildings.items.year_demolished.title}: earliest estimate`}
                    titleMax={`${dataFields.past_buildings.items.year_demolished.title}: latest estimate`}
                    required={required}
                />
                <DataEntry
                    className='lifespan-entry'
                    slug='lifespan'
                    slugModifier={index}
                    title={dataFields.past_buildings.items.lifespan.title}
                    value={formatRange(minLifespan, maxLifespan)}
                    disabled={true}
                />
            </FieldRow>
            <SelectDataEntry
                slug='overlap_present'
                slugModifier={index}
                title={dataFields.past_buildings.items.overlap_present.title}
                onChange={onFieldChange}
                value={value.overlap_present}
                options={percentOverlapOption}
                disabled={disabled}
                required={required}
            />
            <MultiDataEntry
                slug='links'
                slugModifier={index}
                title={dataFields.past_buildings.items.links.title}
                onChange={onFieldChange}
                value={value.links}
                disabled={disabled}
                editableEntries={true}
                mode={mode}
            />
        </>
    )
};

interface DynamicsDataEntryProps extends BaseDataEntryProps {
    value: PastBuilding[];
    editableEntries: boolean;
    maxYear: number;
    minYear: number;
    onSaveAdd: (slug: string, newItem: any) => void;
    hasEdits: boolean;
}

type WithId<T> = T & { _id: number };

function withIds<T>(values: T[]) : WithId<T>[] {
    return values.map((x, i) => ({...x, ...{_id: i * 3}}));
}

function dropId<T>(valueWithId: WithId<T>): T {
    const valueWithoutId = {...valueWithId};
    delete valueWithoutId._id;
    return valueWithoutId;
}

function isValid(val: PastBuilding) {
    if(val == undefined) return false;


    if(typeof val.year_constructed?.min !== 'number') return false;
    if(typeof val.year_constructed?.max !== 'number') return false;

    if(typeof val.year_demolished?.min !== 'number') return false;
    if(typeof val.year_demolished?.max !== 'number') return false;

    if(val.overlap_present == undefined) return false;

    return true;
}

export const DynamicsDataEntry: React.FC<DynamicsDataEntryProps> = (props) => {
    const [newValue, setNewValue] = useState<PastBuilding>();

    const values: PastBuilding[] = props.value ?? [];
    const isEditing = props.mode === 'edit';
    const isDisabled = !isEditing || props.disabled;

    const addNew = useCallback(() => {
        const val = {...newValue};
        
        // fill in required array field if not present
        val.links = val.links ?? [];

        setNewValue(undefined);
        props.onSaveAdd(props.slug, val);
    }, [values, newValue]);
    
    const edit = useCallback((id: number, val: PastBuilding) => {
        const editedValues = [...values];
        editedValues.splice(id, 1, val);

        props.onChange(props.slug, editedValues);
    }, [values]);

    const remove = useCallback((id: number) => {
        const editedValues = [...values];
        editedValues.splice(id, 1);

        props.onChange(props.slug, editedValues);
    }, [values]);

    return (
        <>
            {/* <DataTitleCopyable
                slug={props.slug}
                title={props.title}
                tooltip={props.tooltip}
                disabled={props.disabled || values == undefined || values.length === 0}
                copy={props.copy}
            /> */}
            <div>
                <ul className="data-link-list">
                    {
                        values.length === 0 && !isEditing &&
                        <div className="input-group">
                            <input className="form-control no-entries" type="text" value="No past buildings" disabled={true} />
                        </div>
                    }
                    {
                        values.map((pastBuilding, id) => (
                            <li key={id}>
                                <DynamicsBuildingPane>
                                    <label>Past building</label>
                                    {
                                        !isDisabled &&
                                            <button type="button" className="btn btn-outline-dark delete-record-button"
                                                title="Delete Record"
                                                onClick={() => remove(id)}
                                                data-index={id}
                                            >x</button>
                                    }
                                    <DynamicsDataRow
                                        value={pastBuilding}
                                        disabled={!props.editableEntries || isDisabled}
                                        onChange={(value) => edit(id, value)}
                                        minYear={props.minYear}
                                        maxYear={props.maxYear}
                                        mode={props.mode}
                                        required={true}
                                        index={id}
                                    />
                                </DynamicsBuildingPane>
                            </li>
                        ))
                    }
                </ul>
                {
                    !isDisabled &&
                    <div className='new-record-section'>
                        <h6 className="h6">Add a new historical record</h6>
                        <DynamicsBuildingPane className='new-record'>
                            <DynamicsDataRow
                                value={newValue}
                                onChange={setNewValue}
                                disabled={isDisabled}
                                minYear={props.minYear}
                                maxYear={props.maxYear}
                                mode={props.mode}
                            />
                            <button type="button"
                                className="btn btn-primary btn-block add-record-button"
                                title="Add to list"
                                onClick={addNew}
                                disabled={!isValid(newValue) || props.hasEdits}
                            >
                                {props.hasEdits ? 'Save or discard edits first to add a new record' : 'Save new record'}
                            </button>
                        </DynamicsBuildingPane>
                    </div>
                }
            </div>
        </>
    );
};
