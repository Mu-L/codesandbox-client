import { useQuery } from '@apollo/react-hooks';
import {
  GetGitHubAccountReposQuery,
  GetGitHubAccountReposQueryVariables,
  GetGitHubOrganizationReposQuery,
  GetGitHubOrganizationReposQueryVariables,
} from 'app/graphql/types';
import {
  GET_GITHUB_ACCOUNT_REPOS,
  GET_GITHUB_ORGANIZATION_REPOS,
} from '../queries';

// GitHub makes a distinction between personal and organization accounts
// both are accounts, so I'm calling them that.

type UseGitHubAccountRepositoriesOptions = {
  name?: string;
  accountType?: 'personal' | 'organization';
};

export const useGitHubAccountRepositories = ({
  name,
  accountType,
}: UseGitHubAccountRepositoriesOptions) => {
  const skipLoadingPersonal = accountType === 'organization' || !name;
  const skipLoadingOrganization = accountType === 'personal' || !name;

  // Query the personal repositories unless the selected github account
  // is an organization
  const account = useQuery<
    GetGitHubAccountReposQuery,
    GetGitHubAccountReposQueryVariables
  >(GET_GITHUB_ACCOUNT_REPOS, {
    skip: skipLoadingPersonal,
    variables: {
      perPage: 10, // TODO determine how much repos
      page: 1,
    },
    // Apollo (this version) has weird caching issues where fetching anything from "me" with apollo overrides
    // the previous result. In this case the githubProfile is overridden and the values are gone. Adding
    // fetchPolicy: 'no-cache' fixes this. More info:
    // https://stackoverflow.com/questions/52381150/queries-overwriting-with-missing-fields-in-the-apollo-cache
    // https://github.com/apollographql/apollo-client/issues/3234
    // https://kamranicus.com/graphql-apollo-object-caching/
    fetchPolicy: 'no-cache',
  });

  // Query the organization repositories unless the selected github account
  // is personal.
  const organization = useQuery<
    GetGitHubOrganizationReposQuery,
    GetGitHubOrganizationReposQueryVariables
  >(GET_GITHUB_ORGANIZATION_REPOS, {
    skip: skipLoadingOrganization,
    variables: {
      organization: name,
      perPage: 10, // TODO determine how much repos
      page: 1,
    },
  });

  const error = account.error || organization.error;

  if (error) {
    return {
      state: 'error',
      error: error.message,
    };
  }

  const accountData = account?.data?.me?.githubRepos;
  const organizationData = organization?.data?.githubOrganizationRepos;

  if (
    typeof accountData === 'undefined' &&
    typeof organizationData === 'undefined'
  ) {
    return {
      state: 'loading',
    };
  }

  return {
    state: 'ready',
    data: accountData || organizationData,
  };
};