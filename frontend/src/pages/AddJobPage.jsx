import { useState } from "react";

function AddJobPage({ onAddJob, editingJob, onUpdateJob, onCancelEdit }) {
  const [formData, setFormData] = useState({
    title: editingJob?.title || "",
    company: editingJob?.company || "",
    country: editingJob?.country || "",
    city: editingJob?.city || "",
    type: editingJob?.type || "Onsite",
    salary: editingJob?.salary || "",
    link: editingJob?.link || "",
    description: editingJob?.description || "",
  });

  const [formError, setFormError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function validateForm() {
  if (formData.title.trim().length < 3) {
    return "Job title must be at least 3 characters.";
  }

  if (formData.company.trim().length < 2) {
    return "Company name must be at least 2 characters.";
  }

  if (formData.country.trim().length < 2) {
    return "Country must be at least 2 characters.";
  }

  if (formData.city.trim().length < 2) {
    return "City must be at least 2 characters.";
  }

  if (!formData.salary.trim()) {
    return "Salary is required.";
  }

  if (!formData.link.startsWith("http://") && !formData.link.startsWith("https://")) {
    return "Company website link must start with http:// or https://";
  }

  if (formData.description.trim().length < 10) {
    return "Description must be at least 10 characters.";
  }

  return "";
}

function handleSubmit(event) {
  event.preventDefault();

  const validationError = validateForm();

  if (validationError) {
    setFormError(validationError);
    return;
  }

  setFormError("");

  if (editingJob) {
    onUpdateJob(editingJob.id, formData);
  } else {
    onAddJob(formData);
  }
}

  return (
    <>
      <div className="page-title">
        <p>Company Area</p>
        <h1>{editingJob ? "Edit job" : "Add a new job"}</h1>
        <span>
          Companies can add jobs manually. Later we will save this data inside
          PostgreSQL.
        </span>
      </div>

      <form className="job-form" onSubmit={handleSubmit}>
        {formError && <p className="form-error">{formError}</p>}
        <div className="form-group">
          <label>Job Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            type="text"
            required
          />
        </div>

        <div className="form-group">
          <label>Company</label>
          <input
            name="company"
            value={formData.company}
            onChange={handleChange}
            type="text"
            required
          />
        </div>

        <div className="form-group">
          <label>Country</label>
          <input
            name="country"
            value={formData.country}
            onChange={handleChange}
            type="text"
            required
          />
        </div>

        <div className="form-group">
          <label>City</label>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            type="text"
            required
          />
        </div>

        <div className="form-group">
          <label>Job Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option>Onsite</option>
            <option>Hybrid</option>
            <option>Remote</option>
          </select>
        </div>

        <div className="form-group">
          <label>Salary</label>
          <input
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            type="text"
            required
          />
        </div>

        <div className="form-group full">
          <label>Company Website Link</label>
          <input
            name="link"
            value={formData.link}
            onChange={handleChange}
            type="url"
            required
          />
        </div>

        <div className="form-group full">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-actions">
          <button className="submit-btn" type="submit">
            {editingJob ? "Update Job" : "Add Job"}
          </button>

          {editingJob && (
            <button className="cancel-btn" type="button" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  );
}

export default AddJobPage;