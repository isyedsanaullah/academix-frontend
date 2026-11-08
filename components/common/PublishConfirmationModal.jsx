'use client';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../Icon';

const PublishConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  announcement,
  isSubmitting = false,
}) => {
  if (!isOpen || !announcement) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Publish Announcement?"
      subtitle="Review target audience and priority before broadcasting."
      maxWidth="max-w-lg"
      footer={
        <>
          <Button isStroke onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button isPrimary onClick={onConfirm} disabled={isSubmitting} icon="megaphone">
            {isSubmitting ? 'Publishing...' : 'Confirm & Publish'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 bg-b-surface1 p-5 rounded-3xl border border-s-subtle text-body-2 text-t-primary">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-01/12 text-primary-01 shrink-0">
            <Icon name="megaphone" className="!size-5 fill-primary-01" />
          </div>
          <div>
            <p className="text-caption text-t-secondary uppercase tracking-wider font-semibold">
              Announcement Title
            </p>
            <p className="text-sub-title-1 text-t-primary mt-0.5">
              {announcement.title}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="label label-blue">
            Category: {announcement.category}
          </span>
          <span className="label label-yellow">
            Priority: {announcement.priority}
          </span>
          <span className="label label-green">
            Audience: {announcement.audience}
          </span>
        </div>

        <p className="pt-1 text-caption text-t-secondary">
          Publishing will make this notice immediately visible to target users across dashboards and send in-app notifications.
        </p>
      </div>
    </Modal>
  );
};

export default PublishConfirmationModal;
