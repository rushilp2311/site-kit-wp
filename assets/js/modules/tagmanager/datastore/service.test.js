/**
 * modules/tagmanager data store: service tests.
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
 * Wordpress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 *
 * Internal dependencies
 */
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'module/adsense service store', () => {
	const userData = {
		id: 1,
		email: 'admin@fakedomain.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};
	const baseURI = 'https://tagmanager.google.com/';

	let registry;

	beforeAll( async () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveUserInfo( userData );
	} );

	afterAll( async () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', async () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL();
				expect( serviceURL ).toBe( `${ baseURI }?authuser=${ userData.email }#` );
			} );

			it( 'adds the path parameter', () => {
				const expectedURL = `${ baseURI }?authuser=${ userData.email }#/test/path/to/deeplink`;
				const serviceURLNoSlashes = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURLNoSlashes ).toEqual( expectedURL );
				const serviceURLWithLeadingSlash = registry.select( STORE_NAME ).getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURLWithLeadingSlash ).toEqual( expectedURL );
			} );

			it( 'adds query args', async () => {
				const query = {
					param1: 1,
					param2: 2,
				};
				const expectedURL = addQueryArgs( `${ baseURI }?authuser=${ userData.email }#/test/path/to/deeplink`, query );
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink', query } );
				expect( serviceURL ).toEqual( expectedURL );
			} );
		} );
	} );
} );
