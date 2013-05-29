import os
from urllib2 import HTTPError
from urlparse import urljoin

from django.conf import settings
from wstore.repository_adaptor.repositoryAdaptor import RepositoryAdaptor
from wstore.models import Offering, Repository


def rollback(provider, profile, json_data, msg):

    # Check the created exceptions in order to determine if is
    # necessary to remove something
    if msg == 'Missing required fields' or msg == 'Invalid version format' \
    or msg == 'The offering already exists':
        return

    # Check files
    dir_name = profile.organization.name + '__' + json_data['name'] + '__' + json_data['version']
    path = os.path.join(settings.MEDIA_ROOT, dir_name)

    if os.path.exists(path):
        # Remove all files and directory
        for file_ in os.listdir(path):
            file_path = os.path.join(path, file_)
            os.remove(file_path)

        os.rmdir(path)

    # Check if the offering has been created
    offering = Offering.objects.filter(owner_organization=profile.organization.name, name=json_data['name'], version=json_data['version'])

    remove = False
    if len(offering) > 0:
        offering = offering[0]

        # If the offerings has been created means that the USDL is
        # uploded in the repository
        if 'offering_description' in json_data:
            remove = True
            url = offering.description_url

        offering.delete()
    else:
        # Check if the usdl was uploaded before the exception
        if 'offerings_description' in json_data:
            repository = Repository.objects.get(name=json_data['repository'])
            repository_adaptor = RepositoryAdaptor(repository.host, 'storeOfferingCollection')
            offering_id = profile.organization.name + '__' + json_data['name'] + '__' + json_data['version']

            uploaded = True
            try:
                repository_adaptor.download(name=offering_id, content_type=json_data['offering_description']['content_type'])
            except HTTPError:
                uploaded = False

            if uploaded:
                remove = True
                url = urljoin(repository.host, 'storeOfferingCollection')
                url = urljoin(url, offering_id)

    if remove:
        repository_adaptor = RepositoryAdaptor(url)
        repository_adaptor.delete()


class OfferingRollback():

    _func = None

    def __init__(self, func):
        self._func = func

    def __call__(self, provider, profile, json_data):

        try:
            self._func(provider, profile, json_data)
        except HTTPError, e:
            rollback(provider, profile, json_data, 'Http error')
            raise e
        except Exception, e:
            rollback(provider, profile, json_data, e.message)
            raise e