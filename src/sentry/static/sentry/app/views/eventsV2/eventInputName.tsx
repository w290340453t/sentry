import React from 'react';
import styled from 'react-emotion';
import {browserHistory} from 'react-router';

import {Client} from 'app/api';
import {t} from 'app/locale';
import {Organization, SavedQuery} from 'app/types';
import withApi from 'app/utils/withApi';

import {addErrorMessage} from 'app/actionCreators/indicator';

import InlineInput from 'app/components/inputInline';
import {handleUpdateQueryName} from './savedQuery/utils';

import EventView from './eventView';

type Props = {
  api: Client;
  organization: Organization;
  eventView: EventView;
  savedQueries: SavedQuery[];
  onQuerySave: () => void;
};

const NAME_DEFAULT = t('Untitled query');

/**
 * Allows user to edit the name of the query. Upon blurring from it, it will
 * save the name change immediately (but not changes in the query)
 */
class EventInputName extends React.Component<Props> {
  private refInput = React.createRef<InlineInput>();

  onBlur = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {api, organization, eventView, savedQueries} = this.props;
    const nextQueryName = (event.target.value || '').trim();

    // Do not update automatically if
    // 1) New name is empty
    // 2) It is a new query
    // 3) The new name is same as the old name
    if (!nextQueryName) {
      addErrorMessage(t('Please set a name for this query'));

      // Help our users re-focus so they cannot run away from this problem
      if (this.refInput.current) {
        this.refInput.current.focus();
      }

      return;
    }

    const savedQuery = savedQueries.find(s => s.id === eventView.id);
    if (!savedQuery || savedQuery.name === nextQueryName) {
      return;
    }

    // This ensures that we are updating SavedQuery.name only.
    // Changes on QueryBuilder table will not be saved.
    const nextEventView = EventView.fromSavedQuery({
      ...savedQuery,
      name: nextQueryName,
    });

    handleUpdateQueryName(api, organization, nextEventView).then(
      (updatedQuery: SavedQuery) => {
        this.props.onQuerySave();
        const view = EventView.fromSavedQuery(updatedQuery);
        browserHistory.push({
          pathname: location.pathname,
          query: view.generateQueryStringObject(),
        });
      }
    );
  };

  render() {
    const {eventView} = this.props;

    return (
      <StyledHeader>
        <InlineInput
          ref={this.refInput}
          name="discover2-query-name"
          disabled={!eventView.id}
          value={eventView.name || NAME_DEFAULT}
          onBlur={this.onBlur}
        />
      </StyledHeader>
    );
  }
}

const StyledHeader = styled('div')`
  display: flex;
  align-items: center;
  height: 24px;
  font-size: ${p => p.theme.headerFontSize};
  color: ${p => p.theme.gray4};
  grid-column: 1/2;
`;

export default withApi(EventInputName);
