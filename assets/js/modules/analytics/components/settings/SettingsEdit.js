/**
 * Analytics Settings Edit component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, ACCOUNT_CREATE } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import SettingsForm from './SettingsForm';
import ProgressBar from '../../../../components/progress-bar';
import {
	AccountCreate,
	AccountCreateLegacy,
	ExistingTagError,
	ExistingGTMPropertyError,
} from '../common';
const { useSelect, useDispatch } = Data;

export default function SettingsEdit() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const hasExistingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasExistingTagPermission() );
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const isDoingSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).isDoingSubmitChanges() );
	const hasResolvedAccounts = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ) );
	const usingProxy = useSelect( ( select ) => select( CORE_SITE ).isUsingProxy() );

	const { hasGTMAnalyticsPropertyID, hasGTMAnalyticsPropertyIDPermission } = useSelect( ( select ) => {
		const gtmPropertyID = select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();
		return {
			hasGTMAnalyticsPropertyID: !! gtmPropertyID,
			hasGTMAnalyticsPropertyIDPermission: gtmPropertyID ? select( STORE_NAME ).hasTagPermission( gtmPropertyID ) : false,
		};
	} );

	// Set the accountID and containerID if there is an existing tag.
	useExistingTagEffect();

	// Toggle disabled state of legacy confirm changes button.
	useEffect( () => {
		const confirm = global.document.getElementById( 'confirm-changes-analytics' );
		if ( confirm ) {
			confirm.disabled = ! canSubmitChanges;
		}
	}, [ canSubmitChanges ] );

	const { submitChanges } = useDispatch( STORE_NAME );
	useEffect( () => {
		addFilter(
			'googlekit.SettingsConfirmed',
			'googlekit.AnalyticsSettingsConfirmed',
			async ( chain, module ) => {
				if ( 'analytics-module' === module ) {
					const { error } = await submitChanges();
					if ( error ) {
						return Promise.reject( error );
					}
					return Promise.resolve();
				}
				return chain;
			}
		);

		return () => {
			removeFilter(
				'googlekit.SettingsConfirmed',
				'googlekit.AnalyticsSettingsConfirmed',
			);
		};
	}, [] );

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if ( isDoingSubmitChanges || ! hasResolvedAccounts ) {
		viewComponent = <ProgressBar />;
	} else if ( hasExistingTag && hasExistingTagPermission === false ) {
		viewComponent = <ExistingTagError />;
	} else if ( hasGTMAnalyticsPropertyID && ! hasGTMAnalyticsPropertyIDPermission ) {
		viewComponent = <ExistingGTMPropertyError />;
	} else if ( ! accounts.length || isCreateAccount ) {
		viewComponent = usingProxy ? <AccountCreate /> : <AccountCreateLegacy />;
	} else {
		viewComponent = <SettingsForm />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			{ viewComponent }
		</div>
	);
}
