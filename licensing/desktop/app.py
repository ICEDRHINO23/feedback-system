from __future__ import annotations

import os
import sys
import requests

from PySide6.QtCore import Qt
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QApplication, QFormLayout, QGridLayout, QGroupBox, QHBoxLayout,
    QLabel, QLineEdit, QMainWindow, QMessageBox, QPushButton, QSpinBox,
    QTabWidget, QTextEdit, QVBoxLayout, QWidget
)

API_URL = os.getenv("RAS_LICENSE_API", "http://127.0.0.1:8743").rstrip("/")
MANAGER_KEY = os.getenv("RAS_LICENSE_MANAGER_KEY", "dev-manager-key")


class Api:
    def __init__(self):
        self.headers = {"X-RAS-Manager-Key": MANAGER_KEY}

    def get(self, path):
        r = requests.get(API_URL + path, headers=self.headers, timeout=10)
        r.raise_for_status()
        return r.json()

    def post(self, path, payload):
        r = requests.post(API_URL + path, headers=self.headers, json=payload, timeout=10)
        r.raise_for_status()
        return r.json()


class Dashboard(QWidget):
    def __init__(self, api: Api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)
        title = QLabel("RAS License Manager")
        title.setFont(QFont("Segoe UI", 24, QFont.Bold))
        layout.addWidget(title)
        self.status = QLabel("Checking licensing service…")
        layout.addWidget(self.status)
        self.details = QTextEdit()
        self.details.setReadOnly(True)
        layout.addWidget(self.details)
        refresh = QPushButton("Refresh")
        refresh.clicked.connect(self.refresh)
        layout.addWidget(refresh, alignment=Qt.AlignLeft)
        self.refresh()

    def refresh(self):
        try:
            health = self.api.get("/health")
            products = self.api.get("/products")
            self.status.setText("● Licensing service connected")
            self.details.setPlainText(
                f"Service: {health.get('service')}\n"
                f"Version: {health.get('version')}\n"
                f"Products: {len(products)}\n\n"
                + "\n".join(
                    f"• {p['product_code']} — {p['name']}"
                    for p in products
                )
            )
        except Exception as exc:
            self.status.setText("● Licensing service unavailable")
            self.details.setPlainText(str(exc))


class Products(QWidget):
    def __init__(self, api: Api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)

        form_box = QGroupBox("Register Product")
        form = QFormLayout(form_box)
        self.code = QLineEdit()
        self.name = QLineEdit()
        self.version = QLineEdit("1.0")
        self.description = QLineEdit()
        form.addRow("Product code", self.code)
        form.addRow("Product name", self.name)
        form.addRow("Version", self.version)
        form.addRow("Description", self.description)
        button = QPushButton("Create Product")
        button.clicked.connect(self.create)
        form.addRow(button)
        layout.addWidget(form_box)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        layout.addWidget(self.output)
        self.refresh()

    def refresh(self):
        try:
            products = self.api.get("/products")
            self.output.setPlainText(
                "\n".join(
                    f"{p['product_code']} | {p['name']} | v{p.get('version') or '-'}"
                    for p in products
                ) or "No products registered."
            )
        except Exception as exc:
            self.output.setPlainText(str(exc))

    def create(self):
        try:
            self.api.post(
                "/products",
                {
                    "product_code": self.code.text().strip(),
                    "name": self.name.text().strip(),
                    "version": self.version.text().strip() or "1.0",
                    "description": self.description.text().strip(),
                },
            )
            self.code.clear(); self.name.clear(); self.description.clear()
            self.refresh()
        except Exception as exc:
            QMessageBox.critical(self, "Create Product", str(exc))


class Customers(QWidget):
    def __init__(self, api: Api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)
        form_box = QGroupBox("Register Customer")
        form = QFormLayout(form_box)
        self.code = QLineEdit()
        self.name = QLineEdit()
        self.contact = QLineEdit()
        self.email = QLineEdit()
        self.phone = QLineEdit()
        form.addRow("Customer code", self.code)
        form.addRow("School / customer", self.name)
        form.addRow("Contact person", self.contact)
        form.addRow("Email", self.email)
        form.addRow("Phone", self.phone)
        button = QPushButton("Create Customer")
        button.clicked.connect(self.create)
        form.addRow(button)
        layout.addWidget(form_box)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        layout.addWidget(self.output)
        self.output.setPlainText("Customers are stored by the licensing API. Use the API or a later customer-grid view to browse them.")

    def create(self):
        try:
            result = self.api.post(
                "/customers",
                {
                    "customer_code": self.code.text().strip(),
                    "name": self.name.text().strip(),
                    "contact_person": self.contact.text().strip(),
                    "email": self.email.text().strip(),
                    "phone": self.phone.text().strip(),
                },
            )
            self.output.setPlainText(
                f"Created customer: {result['customer_code']} — {result['name']}"
            )
            self.code.clear(); self.name.clear(); self.contact.clear(); self.email.clear(); self.phone.clear()
        except Exception as exc:
            QMessageBox.critical(self, "Create Customer", str(exc))


class IssueLicense(QWidget):
    def __init__(self, api: Api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)
        box = QGroupBox("Issue License")
        form = QFormLayout(box)
        self.customer = QLineEdit()
        self.product = QLineEdit("RAS-ASSESS")
        self.plan = QLineEdit()
        self.days = QSpinBox()
        self.days.setRange(0, 3650)
        self.days.setValue(365)
        self.activations = QSpinBox()
        self.activations.setRange(1, 1000)
        self.activations.setValue(1)
        form.addRow("Customer code", self.customer)
        form.addRow("Product code", self.product)
        form.addRow("Plan code (optional)", self.plan)
        form.addRow("Validity (days)", self.days)
        form.addRow("Activation slots", self.activations)
        button = QPushButton("Generate License")
        button.clicked.connect(self.issue)
        form.addRow(button)
        layout.addWidget(box)

        warning = QLabel(
            "The generated key is displayed once. Store it securely. "
            "The server stores only a hash of the key."
        )
        warning.setWordWrap(True)
        layout.addWidget(warning)

        self.output = QTextEdit()
        self.output.setReadOnly(True)
        layout.addWidget(self.output)

    def issue(self):
        try:
            payload = {
                "customer_code": self.customer.text().strip(),
                "product_code": self.product.text().strip(),
                "plan_code": self.plan.text().strip() or None,
                "allowed_activations": self.activations.value(),
                "metadata": {},
            }
            result = self.api.post("/licenses/issue", payload)
            self.output.setPlainText(
                "LICENSE GENERATED\n\n"
                f"Key: {result['license_key']}\n"
                f"Customer: {result['customer']}\n"
                f"Product: {result['product']}\n"
                f"Plan: {result.get('plan') or '-'}\n"
                f"Expires: {result.get('expires_at') or 'perpetual'}\n"
                f"Activation slots: {result['allowed_activations']}"
            )
        except Exception as exc:
            QMessageBox.critical(self, "Generate License", str(exc))


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("RAS License Manager")
        self.resize(1100, 720)
        api = Api()
        tabs = QTabWidget()
        tabs.addTab(Dashboard(api), "Dashboard")
        tabs.addTab(Products(api), "Products")
        tabs.addTab(Customers(api), "Customers")
        tabs.addTab(IssueLicense(api), "Licenses")
        self.setCentralWidget(tabs)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = MainWindow()
    window.show()
    raise SystemExit(app.exec())
