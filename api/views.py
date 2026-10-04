class DailyProductionViewSet(viewsets.ModelViewSet):

    queryset = DailyProduction.objects.select_related(
        "branch",
        "employee",
        "product",
    ).all().order_by(
        "-production_date",
        "employee__name",
        "product__name",
    )

    serializer_class = DailyProductionSerializer
    permission_classes = [IsAuthenticated]

    # =========================================================
    # LIST / FILTER
    # =========================================================

    def get_queryset(self):

        queryset = super().get_queryset()
        user = self.request.user

        # -----------------------------------------------------
        # ADMIN
        # -----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:
            pass

        # -----------------------------------------------------
        # BRANCH USER
        # -----------------------------------------------------

        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # =====================================================
        # FILTERS
        # =====================================================

        from_date = self.request.query_params.get(
            "from_date"
        )

        to_date = self.request.query_params.get(
            "to_date"
        )

        branch_id = self.request.query_params.get(
            "branch"
        )

        employee_id = self.request.query_params.get(
            "employee"
        )

        product_id = self.request.query_params.get(
            "product"
        )

        # -----------------------------------------------------
        # DATE
        # -----------------------------------------------------

        if from_date:

            queryset = queryset.filter(
                production_date__gte=from_date
            )

        if to_date:

            queryset = queryset.filter(
                production_date__lte=to_date
            )

        # -----------------------------------------------------
        # BRANCH - ADMIN ONLY
        # -----------------------------------------------------

        if branch_id and (
            user.role == "Admin"
            or user.is_superuser
        ):

            queryset = queryset.filter(
                branch_id=branch_id
            )

        # -----------------------------------------------------
        # EMPLOYEE
        # -----------------------------------------------------

        if employee_id:

            queryset = queryset.filter(
                employee_id=employee_id
            )

        # -----------------------------------------------------
        # PRODUCT
        # -----------------------------------------------------

        if product_id:

            queryset = queryset.filter(
                product_id=product_id
            )

        return queryset

    # =========================================================
    # CREATE PRODUCTION
    # =========================================================

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        employee = serializer.validated_data.get(
            "employee"
        )

        product = serializer.validated_data.get(
            "product"
        )

        quantity = serializer.validated_data.get(
            "quantity"
        )

        production_date = serializer.validated_data.get(
            "production_date"
        )

        # =====================================================
        # VALIDATION
        # =====================================================

        if not employee:

            raise serializers.ValidationError({
                "employee": "Employee is required."
            })

        if not product:

            raise serializers.ValidationError({
                "product": "Product is required."
            })

        if not quantity or quantity <= 0:

            raise serializers.ValidationError({
                "quantity": "Quantity must be greater than 0."
            })

        # =====================================================
        # BRANCH USER VALIDATION
        # =====================================================

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            if employee.branch_id != user.branch_id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee does not belong to your branch."
                })

        # =====================================================
        # BRANCH COMES FROM EMPLOYEE
        # =====================================================

        branch = employee.branch

        # =====================================================
        # CREATE DAILY PRODUCTION
        # =====================================================

        production = serializer.save(
            branch=branch
        )

        # =====================================================
        # GET / CREATE BRANCH STOCK
        #
        # IMPORTANT:
        # Lock this row so concurrent requests cannot
        # update the same stock incorrectly.
        # =====================================================

        branch_product, created = (
            BranchProduct.objects.select_for_update().get_or_create(

                branch=branch,

                product=product,

                defaults={
                    "stock": 0,
                    "selling_price": product.purchase_price,
                },
            )
        )

        # =====================================================
        # ADD PRODUCTION STOCK - ONLY ONCE
        # =====================================================

        branch_product.stock = (
            branch_product.stock + quantity
        )

        branch_product.save(
            update_fields=["stock"]
        )

        # =====================================================
        # CREATE STOCK HISTORY ONLY
        #
        # IMPORTANT:
        # This does NOT update BranchProduct stock.
        # It is only a history record.
        # =====================================================

        StockTransfer.objects.create(

            product=product,

            branch=branch,

            quantity=quantity,

            transfer_date=production_date,

            remarks=(
                f"Daily Production #{production.id} - "
                f"{employee.name}"
            ),
        )

    # =========================================================
    # UPDATE PRODUCTION
    # =========================================================

    @transaction.atomic
    def perform_update(self, serializer):

        user = self.request.user

        # -----------------------------------------------------
        # OLD PRODUCTION
        # -----------------------------------------------------

        old_production = self.get_object()

        old_employee = old_production.employee
        old_product = old_production.product
        old_branch = old_production.branch
        old_quantity = old_production.quantity

        # -----------------------------------------------------
        # NEW VALUES
        # -----------------------------------------------------

        employee = serializer.validated_data.get(
            "employee",
            old_employee
        )

        product = serializer.validated_data.get(
            "product",
            old_product
        )

        quantity = serializer.validated_data.get(
            "quantity",
            old_quantity
        )

        production_date = serializer.validated_data.get(
            "production_date",
            old_production.production_date
        )

        # =====================================================
        # VALIDATION
        # =====================================================

        if not employee:

            raise serializers.ValidationError({
                "employee": "Employee is required."
            })

        if not product:

            raise serializers.ValidationError({
                "product": "Product is required."
            })

        if not quantity or quantity <= 0:

            raise serializers.ValidationError({
                "quantity":
                "Quantity must be greater than 0."
            })

        # =====================================================
        # BRANCH USER VALIDATION
        # =====================================================

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            if employee.branch_id != user.branch_id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee does not belong to your branch."
                })

        # =====================================================
        # NEW BRANCH
        # =====================================================

        new_branch = employee.branch

        # =====================================================
        # LOCK OLD STOCK
        # =====================================================

        old_branch_product = (
            BranchProduct.objects.select_for_update().get(
                branch=old_branch,
                product=old_product,
            )
        )

        # =====================================================
        # REMOVE OLD PRODUCTION STOCK
        # =====================================================

        if old_branch_product.stock < old_quantity:

            raise serializers.ValidationError({
                "quantity": (
                    "Cannot update production because the "
                    "previous production stock has already "
                    "been used or sold."
                )
            })

        old_branch_product.stock -= old_quantity

        old_branch_product.save(
            update_fields=["stock"]
        )

        # =====================================================
        # SAVE UPDATED PRODUCTION
        # =====================================================

        production = serializer.save(
            branch=new_branch
        )

        # =====================================================
        # GET / CREATE NEW STOCK
        # =====================================================

        new_branch_product, created = (
            BranchProduct.objects.select_for_update().get_or_create(

                branch=new_branch,

                product=product,

                defaults={
                    "stock": 0,
                    "selling_price": product.purchase_price,
                },
            )
        )

        # =====================================================
        # ADD NEW PRODUCTION STOCK
        # =====================================================

        new_branch_product.stock += quantity

        new_branch_product.save(
            update_fields=["stock"]
        )

        # =====================================================
        # UPDATE PRODUCTION HISTORY
        # =====================================================

        stock_history = (
            StockTransfer.objects
            .filter(
                remarks__startswith=(
                    f"Daily Production #{production.id}"
                )
            )
            .first()
        )

        if stock_history:

            stock_history.product = product

            stock_history.branch = new_branch

            stock_history.quantity = quantity

            stock_history.transfer_date = production_date

            stock_history.remarks = (
                f"Daily Production #{production.id} - "
                f"{employee.name}"
            )

            stock_history.save()

        else:

            # -------------------------------------------------
            # Safety fallback
            # -------------------------------------------------

            StockTransfer.objects.create(

                product=product,

                branch=new_branch,

                quantity=quantity,

                transfer_date=production_date,

                remarks=(
                    f"Daily Production #{production.id} - "
                    f"{employee.name}"
                ),
            )

    # =========================================================
    # DELETE PRODUCTION
    # =========================================================

    @transaction.atomic
    def perform_destroy(self, instance):

        branch = instance.branch

        product = instance.product

        quantity = instance.quantity

        # =====================================================
        # LOCK BRANCH STOCK
        # =====================================================

        try:

            branch_product = (
                BranchProduct.objects.select_for_update().get(
                    branch=branch,
                    product=product,
                )
            )

        except BranchProduct.DoesNotExist:

            raise serializers.ValidationError({
                "stock":
                "Branch stock record does not exist."
            })

        # =====================================================
        # CHECK STOCK
        # =====================================================

        if branch_product.stock < quantity:

            raise serializers.ValidationError({
                "stock": (
                    "Cannot delete this production because "
                    "the produced stock has already been used "
                    "or sold."
                )
            })

        # =====================================================
        # REMOVE PRODUCTION STOCK
        # =====================================================

        branch_product.stock -= quantity

        branch_product.save(
            update_fields=["stock"]
        )

        # =====================================================
        # DELETE PRODUCTION HISTORY
        # =====================================================

        StockTransfer.objects.filter(
            remarks__startswith=(
                f"Daily Production #{instance.id}"
            )
        ).delete()

        # =====================================================
        # DELETE PRODUCTION
        # =====================================================

        instance.delete()

class EmployeeProductRateViewSet(
    viewsets.ModelViewSet
):

    queryset = EmployeeProductRate.objects.select_related(
        "employee",
        "product",
        "employee__branch",
    ).all()

    serializer_class = EmployeeProductRateSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            pass

        elif user.branch_id:

            queryset = queryset.filter(
                employee__branch_id=user.branch_id
            )

        else:

            return queryset.none()

        employee_id = self.request.query_params.get(
            "employee"
        )

        product_id = self.request.query_params.get(
            "product"
        )

        if employee_id:
            queryset = queryset.filter(
                employee_id=employee_id
            )

        if product_id:
            queryset = queryset.filter(
                product_id=product_id
            )

        return queryset

    def create(self, request, *args, **kwargs):

        user = request.user

        employee_id = request.data.get(
            "employee"
        )

        product_id = request.data.get(
            "product"
        )

        rate = request.data.get(
            "rate_per_piece"
        )

        employee = Employee.objects.filter(
            id=employee_id
        ).first()

        product = Product.objects.filter(
            id=product_id
        ).first()

        if not employee:

            return Response(
                {
                    "error":
                    "Employee not found."
                },
                status=400
            )

        if not product:

            return Response(
                {
                    "error":
                    "Product not found."
                },
                status=400
            )

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if employee.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "Employee does not belong to your branch."
                    },
                    status=403
                )

        try:

            rate_value = float(rate)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Invalid rate."
                },
                status=400
            )

        if rate_value < 0:

            return Response(
                {
                    "error":
                    "Rate cannot be negative."
                },
                status=400
            )

        obj, created = (
            EmployeeProductRate.objects.update_or_create(
                employee=employee,
                product=product,
                defaults={
                    "rate_per_piece":
                    rate_value
                }
            )
        )

        serializer = self.get_serializer(obj)

        return Response(
            serializer.data,
            status=201 if created else 200
        )
# ============================================================
# ALTERATION API
# ============================================================
# ============================================================
# ALTERATION API
# ============================================================
class AlterationViewSet(viewsets.ModelViewSet):

    queryset = Alteration.objects.select_related(
        "branch",
        "product",
        "assigned_employee",
    ).all().order_by(
        "-alteration_date",
        "-id",
    )

    serializer_class = AlterationSerializer
    permission_classes = [IsAuthenticated]

    # ========================================================
    # LIST / FILTER
    # ========================================================

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # ----------------------------------------------------
        # ADMIN → ALL BRANCHES
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:
            pass

        # ----------------------------------------------------
        # BRANCH USER → OWN BRANCH ONLY
        # ----------------------------------------------------

        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # ----------------------------------------------------
        # SEARCH
        # ----------------------------------------------------

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        if search:

            queryset = queryset.filter(
                Q(customer_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(product__name__icontains=search)
                | Q(item_name__icontains=search)
            )

        # ----------------------------------------------------
        # MONTH FILTER
        # ----------------------------------------------------

        month = self.request.query_params.get(
            "month"
        )

        if month:

            try:

                year, month_number = month.split("-")

                queryset = queryset.filter(
                    alteration_date__year=int(year),
                    alteration_date__month=int(month_number),
                )

            except (
                ValueError,
                TypeError
            ):

                pass

        # ----------------------------------------------------
        # STATUS FILTER
        # ----------------------------------------------------

        status_filter = self.request.query_params.get(
            "status"
        )

        if status_filter:

            queryset = queryset.filter(
                status=status_filter
            )

        # ----------------------------------------------------
        # EMPLOYEE FILTER
        # ----------------------------------------------------

        employee_id = self.request.query_params.get(
            "assigned_employee"
        )

        if employee_id:

            queryset = queryset.filter(
                assigned_employee_id=employee_id
            )

        return queryset

    # ========================================================
    # CREATE
    # ========================================================

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # ----------------------------------------------------
        # DETERMINE BRANCH
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch": "Branch is required."
                })

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        # ----------------------------------------------------
        # EMPLOYEE CHECK
        # ----------------------------------------------------

        assigned_employee = (
            serializer.validated_data.get(
                "assigned_employee"
            )
        )

        if assigned_employee:

            if assigned_employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "assigned_employee":
                    "Employee must belong to this branch."
                })

        # ----------------------------------------------------
        # AMOUNT VALIDATION
        # ----------------------------------------------------

        total_amount = serializer.validated_data.get(
            "total_amount",
            Decimal("0")
        )

        advance_amount = serializer.validated_data.get(
            "advance_amount",
            Decimal("0")
        )

        if total_amount < 0:

            raise serializers.ValidationError({
                "total_amount":
                "Total amount cannot be negative."
            })

        if advance_amount < 0:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance amount cannot be negative."
            })

        if advance_amount > total_amount:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance cannot be greater than total amount."
            })

        # ----------------------------------------------------
        # SAVE ALTERATION
        # ----------------------------------------------------

        alteration = serializer.save(
            branch=branch,
            delivered_amount=Decimal("0"),
            status="Pending",
        )

        # ----------------------------------------------------
        # ADVANCE → DAY BOOK
        # ----------------------------------------------------

        if alteration.advance_amount > 0:

            DayBook.objects.create(

                branch=alteration.branch,

                date=alteration.alteration_date,

                transaction_type="Income",

                category="Alteration Advance",

                payment_mode=(
                    alteration.advance_payment_mode
                ),

                description=(
                    f"Alteration #{alteration.id} - "
                    f"{alteration.customer_name}"
                ),

                amount=alteration.advance_amount,
            )

    # ========================================================
    # UPDATE
    # ========================================================

    @transaction.atomic
    def perform_update(self, serializer):

        user = self.request.user

        alteration = self.get_object()

        # ----------------------------------------------------
        # DO NOT EDIT CANCELLED / DELIVERY RECORD
        # ----------------------------------------------------

        if alteration.status == "Delivery":

            raise serializers.ValidationError({
                "status":
                "Delivered alterations cannot be edited."
            })

        if alteration.status == "Cancel":

            raise serializers.ValidationError({
                "status":
                "Cancelled alterations cannot be edited."
            })

        # ----------------------------------------------------
        # DETERMINE BRANCH
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch",
                alteration.branch
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        # ----------------------------------------------------
        # EMPLOYEE CHECK
        # ----------------------------------------------------

        assigned_employee = (
            serializer.validated_data.get(
                "assigned_employee",
                alteration.assigned_employee
            )
        )

        if assigned_employee:

            if assigned_employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "assigned_employee":
                    "Employee must belong to this branch."
                })

        # ----------------------------------------------------
        # AMOUNT CHECK
        # ----------------------------------------------------

        total_amount = serializer.validated_data.get(
            "total_amount",
            alteration.total_amount
        )

        advance_amount = serializer.validated_data.get(
            "advance_amount",
            alteration.advance_amount
        )

        if total_amount < 0:

            raise serializers.ValidationError({
                "total_amount":
                "Total amount cannot be negative."
            })

        if advance_amount < 0:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance cannot be negative."
            })

        if advance_amount > total_amount:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance cannot be greater than total amount."
            })

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        serializer.save(
            branch=branch
        )

    # ========================================================
    # DELIVER ALTERATION
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="deliver"
    )
    @transaction.atomic
    def deliver(self, request, pk=None):

        alteration = self.get_object()

        user = request.user

        # ----------------------------------------------------
        # BRANCH SECURITY
        # ----------------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if alteration.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "You cannot deliver an alteration "
                        "from another branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ----------------------------------------------------
        # ALREADY DELIVERY
        # ----------------------------------------------------

        if alteration.status == "Delivery":

            return Response(
                {
                    "error":
                    "This alteration is already delivered."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CANCELLED
        # ----------------------------------------------------

        if alteration.status == "Cancel":

            return Response(
                {
                    "error":
                    "Cancelled alteration cannot be delivered."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CURRENT BALANCE
        # ----------------------------------------------------

        current_balance = (
            alteration.total_amount
            - alteration.advance_amount
            - alteration.delivered_amount
        )

        if current_balance < 0:

            current_balance = Decimal("0")

        # ----------------------------------------------------
        # DELIVERY AMOUNT
        # ----------------------------------------------------

        delivered_amount = request.data.get(
            "delivered_amount"
        )

        if delivered_amount in [
            None,
            "",
        ]:

            delivered_amount = current_balance

        try:

            delivered_amount = Decimal(
                str(delivered_amount)
            )

        except (
            InvalidOperation,
            ValueError,
            TypeError
        ):

            return Response(
                {
                    "error":
                    "Invalid delivery amount."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # NEGATIVE CHECK
        # ----------------------------------------------------

        if delivered_amount < 0:

            return Response(
                {
                    "error":
                    "Delivery amount cannot be negative."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # FULL BALANCE REQUIRED
        # ----------------------------------------------------

        if delivered_amount != current_balance:

            return Response(
                {
                    "error":
                    "The full balance amount must be "
                    "received before delivery.",
                    "balance_due":
                    str(current_balance),
                    "entered_amount":
                    str(delivered_amount),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # PAYMENT MODE
        # ----------------------------------------------------

        payment_mode = request.data.get(
            "delivery_payment_mode",
            "Cash"
        )

        valid_payment_modes = [
            choice[0]
            for choice in Alteration.PAYMENT_CHOICES
        ]

        if payment_mode not in valid_payment_modes:

            return Response(
                {
                    "error":
                    "Invalid delivery payment mode."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # DELIVERY DATE
        # ----------------------------------------------------

        delivery_date = request.data.get(
            "delivery_date"
        )

        if delivery_date:

            try:

                from datetime import datetime

                delivery_date = datetime.strptime(
                    delivery_date,
                    "%Y-%m-%d"
                ).date()

            except ValueError:

                return Response(
                    {
                        "error":
                        "Invalid delivery date. "
                        "Use YYYY-MM-DD."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        else:

            delivery_date = timezone.localdate()

        # ----------------------------------------------------
        # DELIVERY TIME
        # ----------------------------------------------------

        delivery_time = request.data.get(
            "delivery_time"
        )

        if delivery_time:

            try:

                delivery_time = time.fromisoformat(
                    delivery_time
                )

            except ValueError:

                return Response(
                    {
                        "error":
                        "Invalid delivery time. "
                        "Use HH:MM or HH:MM:SS."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        else:

            delivery_time = timezone.localtime().time()

        # ----------------------------------------------------
        # UPDATE ALTERATION
        # ----------------------------------------------------

        alteration.delivered_amount = (
            delivered_amount
        )

        alteration.delivery_payment_mode = (
            payment_mode
        )

        alteration.delivery_date = (
            delivery_date
        )

        alteration.delivery_time = (
            delivery_time
        )

        alteration.delivered_at = (
            timezone.now()
        )

        alteration.status = "Delivery"

        alteration.save()

        # ----------------------------------------------------
        # BALANCE PAYMENT → DAY BOOK
        # ----------------------------------------------------

        if delivered_amount > 0:

            DayBook.objects.create(

                branch=alteration.branch,

                date=delivery_date,

                transaction_type="Income",

                category="Balance Payment",

                payment_mode=payment_mode,

                description=(
                    f"Alteration #{alteration.id} "
                    f"Balance Payment - "
                    f"{alteration.customer_name}"
                ),

                amount=delivered_amount,
            )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "success": True,

                "message":
                "Alteration delivered successfully.",

                "alteration_id":
                alteration.id,

                "total_amount":
                str(alteration.total_amount),

                "advance_amount":
                str(alteration.advance_amount),

                "delivered_amount":
                str(alteration.delivered_amount),

                "balance_amount":
                str(alteration.balance_amount),

                "delivery_payment_mode":
                alteration.delivery_payment_mode,

                "delivery_date":
                alteration.delivery_date,

                "delivery_time":
                alteration.delivery_time,

                "status":
                alteration.status,
            },
            status=status.HTTP_200_OK
        )
     
class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all().order_by("name")
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can create product categories."
            )

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can edit product categories."
            )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can delete product categories."
            )

        instance.delete()

class BranchProductViewSet(viewsets.ModelViewSet):
    queryset = BranchProduct.objects.select_related(
        "branch",
        "product",
        "product__category",
    ).all()

    serializer_class = BranchProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            pass
        elif user.branch_id:
            queryset = queryset.filter(
                branch_id=user.branch_id
            )
        else:
            return queryset.none()

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(product__name__icontains=search)
                | Q(product__barcode__icontains=search)
            )

        return queryset.order_by(
            "product__name"
        )
  
class StockTransferViewSet(viewsets.ModelViewSet):

    queryset = StockTransfer.objects.select_related(
        "product",
        "branch",
    ).all().order_by("-transfer_date", "-id")

    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # =====================================================
        # ADMIN
        # =====================================================
        if user.role == "Admin" or user.is_superuser:
            return queryset

        # =====================================================
        # BRANCH USER
        # =====================================================
        if user.branch_id:
            return queryset.filter(
                branch_id=user.branch_id
            )

        return queryset.none()

    # =========================================================
    # CREATE STOCK TRANSFER
    # =========================================================

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # -----------------------------------------------------
        # ADMIN
        # -----------------------------------------------------
        if user.role == "Admin" or user.is_superuser:

            transfer = serializer.save()

        # -----------------------------------------------------
        # BRANCH USER
        # -----------------------------------------------------
        else:

            if not user.branch_id:
                raise PermissionDenied(
                    "You are not assigned to any branch."
                )

            # Force the transfer to user's own branch
            transfer = serializer.save(
                branch_id=user.branch_id
            )

        # =====================================================
        # UPDATE BRANCH STOCK
        # =====================================================

        branch_product, created = BranchProduct.objects.get_or_create(

            branch=transfer.branch,
            product=transfer.product,

            defaults={
                "selling_price": transfer.product.purchase_price
            }
        )

        # Add stock
        branch_product.stock += transfer.quantity

        branch_product.save(
            update_fields=["stock"]
        )
@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def branch_dashboard_data(request):

    if request.user.role != "Branch":
        return Response(
            {
                "success": False,
                "message": "Branch access required."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    branch = request.user.branch

    if not branch:
        return Response(
            {
                "success": False,
                "message": "No branch is assigned to this user."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    today = timezone.localdate()

    filter_type = request.GET.get("filter", "today")

    from_date = today
    to_date = today

    # =====================================================
    # DATE FILTER
    # =====================================================

    if filter_type == "yesterday":

        from_date = today - timedelta(days=1)
        to_date = from_date

    elif filter_type == "week":

        from_date = today - timedelta(days=today.weekday())
        to_date = today

    elif filter_type == "month":

        from_date = today.replace(day=1)
        to_date = today

    elif filter_type == "custom":

        from_date_string = request.GET.get("from_date")
        to_date_string = request.GET.get("to_date")

        if from_date_string:
            try:
                from_date = datetime.strptime(
                    from_date_string,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                from_date = today

        if to_date_string:
            try:
                to_date = datetime.strptime(
                    to_date_string,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                to_date = today

        if from_date > to_date:
            from_date, to_date = to_date, from_date

    # =====================================================
    # BRANCH DATA
    # =====================================================

    # Normal tailoring orders
    branch_orders = Order.objects.filter(
        customer__branch=branch,
        order_date__range=[from_date, to_date]
    )

    # Normal order payments
    branch_payments = Payment.objects.filter(
        order__customer__branch=branch,
        payment_date__range=[from_date, to_date]
    )

    # READY-MADE SALES
    branch_sales = Sale.objects.filter(
        branch=branch,
        sale_date__range=[from_date, to_date]
    )

    # DayBook
    branch_daybook = DayBook.objects.filter(
        branch=branch,
        date__range=[from_date, to_date]
    )

    # =====================================================
    # COUNTS
    # =====================================================

    customers = Customer.objects.filter(
        branch=branch
    ).count()

    orders = branch_orders.count()

    pending = branch_orders.filter(
        status="Pending"
    ).count()

    cutting = branch_orders.filter(
        status="Cutting"
    ).count()

    stitching = branch_orders.filter(
        status="Stitching"
    ).count()

    ready = branch_orders.filter(
        status="Ready"
    ).count()

    delivery = branch_orders.filter(
        status="Delivery"
    ).count()

    delivered = branch_orders.filter(
        status="Delivered"
    ).count()

    # =====================================================
    # FINANCIAL
    # =====================================================

    # -----------------------------------------------------
    # ORDER PAYMENTS
    # -----------------------------------------------------

    order_payment_sales = (
        branch_payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # -----------------------------------------------------
    # READY-MADE SALES
    # -----------------------------------------------------

    ready_made_sales = (
        branch_sales.aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # -----------------------------------------------------
    # TOTAL SALES
    # -----------------------------------------------------

    total_sales = (
        order_payment_sales +
        ready_made_sales
    )

    # =====================================================
    # PURCHASE
    # =====================================================

    total_purchase = (
        branch_daybook
        .filter(
            transaction_type="Expense",
            category="Purchase"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # OTHER EXPENSE
    # =====================================================

    total_expense = (
        branch_daybook
        .filter(
            transaction_type="Expense"
        )
        .exclude(
            category="Purchase"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # TOTAL INCOME
    # =====================================================

    # IMPORTANT:
    # Ready-made Sale already creates a DayBook Income entry.
    # Therefore we DO NOT add branch_sales here again.

    total_income = (
        branch_daybook
        .filter(
            transaction_type="Income"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # TOTAL EXPENSE
    # =====================================================

    total_expense_all = (
        total_purchase +
        total_expense
    )

    # =====================================================
    # NET PROFIT
    # =====================================================

    net_profit = (
        total_income -
        total_expense_all
    )

    # =====================================================
    # PAYMENT MODES
    # =====================================================

    def payment_total(mode):

        # Normal tailoring order payments
        order_total = (
            branch_payments
            .filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        # Ready-made sales
        sale_total = (
            branch_sales
            .filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("total")
            )["total"] or 0
        )

        return (
            order_total +
            sale_total
        )

    cash = payment_total("Cash")

    bank = payment_total("Bank")

    online = payment_total("Online")

    cheque = payment_total("Cheque")

    pos = payment_total("POS")

    # =====================================================
    # PAYMENT SUMMARY
    # =====================================================

    # Normal tailoring order advances
    total_advance = (
        branch_payments
        .filter(
            payment_type="Advance"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # Normal tailoring order balance payments
    total_balance_payment = (
        branch_payments
        .filter(
            payment_type="Balance Payment"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # -----------------------------------------------------
    # TOTAL RECEIVED
    # -----------------------------------------------------

    order_received = (
        branch_payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    sale_received = (
        branch_sales.aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    total_received = (
        order_received +
        sale_received
    )

    # =====================================================
    # BILLING
    # =====================================================

    filtered_orders = branch_orders.prefetch_related(
        "items",
        "payments"
    )

    # Normal tailoring order billing
    order_billed = sum(
        order.total_amount()
        for order in filtered_orders
    )

    # Ready-made sale billing
    sale_billed = (
        branch_sales.aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # Total billed
    total_billed = (
        order_billed +
        sale_billed
    )

    # =====================================================
    # OUTSTANDING BALANCE
    # =====================================================

    outstanding_balance = max(
        total_billed - total_received,
        0
    )

    # =====================================================
    # RECENT ORDERS
    # =====================================================

    recent_orders = (
        branch_orders
        .select_related("customer")
        .order_by("-id")[:10]
    )

    recent_orders_data = [
        {
            "id": order.id,
            "customer": order.customer.name,
            "order_date": order.order_date,
            "status": order.status,
            "total_amount": float(
                order.total_amount()
            ),
        }
        for order in recent_orders
    ]

    # =====================================================
    # RECENT PAYMENTS
    # =====================================================

    # Normal order payments
    recent_order_payments = (
        branch_payments
        .select_related(
            "order",
            "order__customer"
        )
        .order_by("-id")[:10]
    )

    recent_payments_data = []

    for payment in recent_order_payments:

        recent_payments_data.append(
            {
                "id": payment.id,
                "customer": payment.order.customer.name,
                "payment_date": payment.payment_date,
                "payment_mode": payment.payment_mode,
                "payment_type": payment.payment_type,
                "amount": float(payment.amount),
                "source": "Order",
            }
        )

    # -----------------------------------------------------
    # READY-MADE SALE PAYMENTS
    # -----------------------------------------------------

    recent_sales = (
        branch_sales
        .select_related(
            "customer"
        )
        .order_by("-id")[:10]
    )

    for sale in recent_sales:

        customer_name = "Walk-in Customer"

        if sale.customer:
            customer_name = sale.customer.name

        recent_payments_data.append(
            {
                "id": f"sale-{sale.id}",
                "customer": customer_name,
                "payment_date": sale.sale_date,
                "payment_mode": sale.payment_mode,
                "payment_type": "Ready Made Sale",
                "amount": float(sale.total),
                "source": "Sale",
            }
        )

    # -----------------------------------------------------
    # SORT RECENT PAYMENTS
    # -----------------------------------------------------

    recent_payments_data = sorted(
        recent_payments_data,
        key=lambda x: str(
            x["payment_date"]
        ),
        reverse=True
    )[:10]

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response(
        {
            "success": True,

            "branch": {
                "id": branch.id,
                "name": branch.name,
            },

            "filter": {
                "type": filter_type,
                "from_date": str(from_date),
                "to_date": str(to_date),
            },

            # =================================================
            # COUNTS
            # =================================================

            "counts": {

                "customers": customers,

                "orders": orders,

                "pending": pending,

                "cutting": cutting,

                "stitching": stitching,

                "ready": ready,

                "delivery": delivery,

                "delivered": delivered,
            },

            # =================================================
            # FINANCIAL
            # =================================================

            "financial": {

                "total_sales": float(
                    total_sales
                ),

                "total_income": float(
                    total_income
                ),

                "total_purchase": float(
                    total_purchase
                ),

                "total_expense": float(
                    total_expense
                ),

                "net_profit": float(
                    net_profit
                ),
            },

            # =================================================
            # PAYMENTS
            # =================================================

            "payments": {

                "cash": float(
                    cash
                ),

                "bank": float(
                    bank
                ),

                "online": float(
                    online
                ),

                "cheque": float(
                    cheque
                ),

                "pos": float(
                    pos
                ),

                "total_advance": float(
                    total_advance
                ),

                "total_balance_payment": float(
                    total_balance_payment
                ),

                "total_received": float(
                    total_received
                ),

                "total_billed": float(
                    total_billed
                ),

                "outstanding_balance": float(
                    outstanding_balance
                ),
            },

            # =================================================
            # RECENT DATA
            # =================================================

            "recent_orders": recent_orders_data,

            "recent_payments": recent_payments_data,
        }
    )
# ============================================================
# STOCK PROCESSING API
# ============================================================

class StockProcessingViewSet(viewsets.ModelViewSet):

    queryset = StockProcessing.objects.select_related(
        "branch",
        "input_product",
        "output_product",
        "employee",
    ).all().order_by(
        "-created_at",
        "-id",
    )

    serializer_class = StockProcessingSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # LIST / FILTER
    # --------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # Admin → all branches
        if user.role == "Admin" or user.is_superuser:
            pass

        # Branch → own branch only
        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # Optional filters
        process_type = self.request.query_params.get(
            "process_type"
        )

        status_filter = self.request.query_params.get(
            "status"
        )

        employee_id = self.request.query_params.get(
            "employee"
        )

        if process_type:
            queryset = queryset.filter(
                process_type=process_type
            )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        if employee_id:
            queryset = queryset.filter(
                employee_id=employee_id
            )

        return queryset

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # -----------------------------------------------
        # DETERMINE BRANCH
        # -----------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        # -----------------------------------------------
        # INPUT PRODUCT
        # -----------------------------------------------

        input_product = (
            serializer.validated_data.get(
                "input_product"
            )
        )

        input_quantity = (
            serializer.validated_data.get(
                "input_quantity"
            )
        )

        if not input_product:

            raise serializers.ValidationError({
                "input_product":
                "Input product is required."
            })

        if not input_quantity or input_quantity <= 0:

            raise serializers.ValidationError({
                "input_quantity":
                "Input quantity must be greater than 0."
            })

        # -----------------------------------------------
        # OUTPUT PRODUCT
        # -----------------------------------------------

        output_product = (
            serializer.validated_data.get(
                "output_product"
            )
        )

        if not output_product:

            raise serializers.ValidationError({
                "output_product":
                "Output product is required."
            })

        # -----------------------------------------------
        # EMPLOYEE
        # -----------------------------------------------

        employee = serializer.validated_data.get(
            "employee"
        )

        if employee:

            if employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee must belong to the selected branch."
                })

        # -----------------------------------------------
        # CHECK BRANCH STOCK
        # -----------------------------------------------

        branch_product = (
            BranchProduct.objects
            .select_for_update()
            .filter(
                branch=branch,
                product=input_product,
            )
            .first()
        )

        if not branch_product:

            raise serializers.ValidationError({
                "input_product":
                "Input product is not available in this branch."
            })

        if branch_product.stock < input_quantity:

            raise serializers.ValidationError({
                "input_quantity":
                f"Insufficient stock for "
                f"{input_product.name}. "
                f"Available stock: "
                f"{branch_product.stock}"
            })

        # -----------------------------------------------
        # SAVE PROCESSING
        # -----------------------------------------------

        processing = serializer.save(
            branch=branch
        )

        # -----------------------------------------------
        # IMPORTANT
        # -----------------------------------------------
        #
        # We DO NOT deduct stock here.
        #
        # Stock is deducted only when the user
        # clicks "Issue".
        #

        return processing

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    def perform_update(self, serializer):

        processing = self.get_object()

        user = self.request.user

        if (
            processing.issued_quantity > 0
            or processing.returned_quantity > 0
        ):

            raise serializers.ValidationError({
                "error":
                "Processing cannot be edited after stock has been issued or returned."
            })

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch",
                processing.branch
            )

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        employee = serializer.validated_data.get(
            "employee",
            processing.employee
        )

        if employee:

            if employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee must belong to the selected branch."
                })

        serializer.save(
            branch=branch
        )

    # ========================================================
    # ISSUE STOCK
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="issue"
    )
    @transaction.atomic
    def issue(self, request, pk=None):

        processing = self.get_object()

        user = request.user

        # -----------------------------------------------
        # BRANCH SECURITY
        # -----------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                return Response(
                    {
                        "error":
                        "User is not assigned to a branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if processing.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "You cannot issue stock for this branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------
        # STATUS CHECK
        # -----------------------------------------------

        if processing.status == "CANCELLED":

            return Response(
                {
                    "error":
                    "Cancelled processing cannot receive stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if processing.status == "COMPLETED":

            return Response(
                {
                    "error":
                    "Completed processing cannot receive more stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # QUANTITY
        # -----------------------------------------------

        quantity = request.data.get(
            "quantity"
        )

        try:

            quantity = int(quantity)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Invalid issue quantity."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:

            return Response(
                {
                    "error":
                    "Issue quantity must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # REMAINING QUANTITY
        # -----------------------------------------------

        remaining = (
            processing.input_quantity
            - processing.issued_quantity
        )

        if quantity > remaining:

            return Response(
                {
                    "error":
                    "Issue quantity exceeds remaining quantity.",
                    "remaining":
                    remaining
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # LOCK BRANCH STOCK
        # -----------------------------------------------

        branch_product = (
            BranchProduct.objects
            .select_for_update()
            .filter(
                branch_id=processing.branch_id,
                product_id=processing.input_product_id,
            )
            .first()
        )

        if not branch_product:

            return Response(
                {
                    "error":
                    "Input product is not available in branch stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # STOCK CHECK
        # -----------------------------------------------

        if branch_product.stock < quantity:

            return Response(
                {
                    "error":
                    f"Insufficient stock. "
                    f"Available stock: "
                    f"{branch_product.stock}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # DEDUCT STOCK
        # -----------------------------------------------

        branch_product.stock -= quantity

        branch_product.save(
            update_fields=["stock"]
        )

        # -----------------------------------------------
        # UPDATE PROCESSING
        # -----------------------------------------------

        processing.issued_quantity += quantity

        if processing.issued_quantity > 0:

            processing.status = "IN_PROGRESS"

        processing.save(
            update_fields=[
                "issued_quantity",
                "status",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(
            processing
        )

        return Response(
            {
                "success": True,
                "message":
                    "Stock issued successfully.",
                "issued_quantity":
                    processing.issued_quantity,
                "remaining_to_issue":
                    processing.remaining_to_issue,
                "branch_stock":
                    branch_product.stock,
                "processing":
                    serializer.data,
            },
            status=status.HTTP_200_OK
        )

    # ========================================================
    # COMPLETE / RETURN STOCK
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="complete"
    )
    @transaction.atomic
    def complete(self, request, pk=None):

        processing = self.get_object()

        user = request.user

        # -----------------------------------------------
        # BRANCH SECURITY
        # -----------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                return Response(
                    {
                        "error":
                        "User is not assigned to a branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if processing.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "You cannot complete this processing."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------
        # STATUS
        # -----------------------------------------------

        if processing.status == "CANCELLED":

            return Response(
                {
                    "error":
                    "Cancelled processing cannot be completed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # MUST HAVE ISSUED STOCK
        # -----------------------------------------------

        if processing.issued_quantity <= 0:

            return Response(
                {
                    "error":
                    "No stock has been issued for this processing."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # QUANTITY RETURNED
        # -----------------------------------------------

        quantity = request.data.get(
            "quantity"
        )

        try:

            quantity = int(quantity)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Invalid return quantity."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:

            return Response(
                {
                    "error":
                    "Return quantity must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # PENDING QUANTITY
        # -----------------------------------------------

        pending = (
            processing.issued_quantity
            - processing.returned_quantity
        )

        if quantity > pending:

            return Response(
                {
                    "error":
                    "Return quantity exceeds pending quantity.",
                    "pending":
                    pending
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # OUTPUT PRODUCT
        # -----------------------------------------------

        if not processing.output_product_id:

            return Response(
                {
                    "error":
                    "Output product is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # LOCK / CREATE BRANCH STOCK
        # -----------------------------------------------

        branch_product = (
            BranchProduct.objects
            .select_for_update()
            .filter(
                branch_id=processing.branch_id,
                product_id=processing.output_product_id,
            )
            .first()
        )

        if not branch_product:

            branch_product = BranchProduct.objects.create(
                branch_id=processing.branch_id,
                product_id=processing.output_product_id,
                stock=0,
                selling_price=processing.output_product.purchase_price,
            )

        # -----------------------------------------------
        # ADD RETURNED STOCK
        # -----------------------------------------------

        branch_product.stock += quantity

        branch_product.save(
            update_fields=["stock"]
        )

        # -----------------------------------------------
        # UPDATE PROCESSING
        # -----------------------------------------------

        processing.returned_quantity += quantity

        processing.status = "IN_PROGRESS"

        # Complete when all issued quantity has returned
        if (
            processing.returned_quantity
            >= processing.issued_quantity
        ):

            processing.status = "COMPLETED"
            processing.completed_date = timezone.now()

        processing.save(
            update_fields=[
                "returned_quantity",
                "status",
                "completed_date",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(
            processing
        )

        return Response(
            {
                "success": True,
                "message":
                    "Stock returned successfully.",
                "returned_quantity":
                    processing.returned_quantity,
                "pending_quantity":
                    processing.pending_quantity,
                "branch_stock":
                    branch_product.stock,
                "status":
                    processing.status,
                "processing":
                    serializer.data,
            },
            status=status.HTTP_200_OK
        )
# ============================================================
# PRODUCTION JOB API
# ============================================================

class ProductionJobViewSet(viewsets.ModelViewSet):

    queryset = ProductionJob.objects.select_related(
        "branch",
        "customer",
    ).prefetch_related(
        "purchases__product",
        "payments",
    ).all().order_by(
        "-job_date",
        "-id",
    )

    serializer_class = ProductionJobSerializer

    permission_classes = [
        IsAuthenticated
    ]

    # --------------------------------------------------------
    # LIST / FILTER
    # --------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # ADMIN → all branches
        if user.role == "Admin" or user.is_superuser:
            pass

        # BRANCH USER → own branch only
        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # Optional status filter

        status_filter = self.request.query_params.get(
            "status"
        )

        if status_filter:

            queryset = queryset.filter(
                status=status_filter
            )

        # Optional customer filter

        customer_id = self.request.query_params.get(
            "customer"
        )

        if customer_id:

            queryset = queryset.filter(
                customer_id=customer_id
            )

        return queryset

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # ---------------------------------------------
        # ADMIN
        # ---------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

        # ---------------------------------------------
        # BRANCH USER
        # ---------------------------------------------

        else:

            if not user.branch_id:

                raise PermissionDenied(
                    "User is not assigned to a branch."
                )

            # IMPORTANT:
            # Ignore any branch sent from frontend

            branch = user.branch

        # ---------------------------------------------
        # CUSTOMER
        # ---------------------------------------------

        customer = serializer.validated_data.get(
            "customer"
        )

        if not customer:

            raise serializers.ValidationError({
                "customer":
                "Customer is required."
            })

        # Branch user can only use own branch customers

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if customer.branch_id != user.branch_id:

                raise PermissionDenied(
                    "You cannot use a customer "
                    "from another branch."
                )

        # ---------------------------------------------
        # SAVE JOB
        # ---------------------------------------------

        serializer.save(
            branch=branch
        )
# ============================================================
# JOB PURCHASE API
# ============================================================

class JobPurchaseViewSet(viewsets.ModelViewSet):

    queryset = JobPurchase.objects.select_related(
        "job",
        "job__branch",
        "job__customer",
        "product",
    ).all().order_by(
        "-purchase_date",
        "-id",
    )

    serializer_class = JobPurchaseSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            pass

        elif user.branch_id:

            queryset = queryset.filter(
                job__branch_id=user.branch_id
            )

        else:

            return queryset.none()

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        job = serializer.validated_data.get(
            "job"
        )

        if not job:

            raise serializers.ValidationError({
                "job":
                "Production job is required."
            })

        # ---------------------------------------------
        # BRANCH SECURITY
        # ---------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if job.branch_id != user.branch_id:

                raise PermissionDenied(
                    "You cannot add a purchase "
                    "to another branch's job."
                )

        # ---------------------------------------------
        # CREATE PURCHASE
        # ---------------------------------------------

        purchase = serializer.save()

        # ---------------------------------------------
        # DAY BOOK EXPENSE
        # ---------------------------------------------

        DayBook.objects.create(

            branch=job.branch,

            date=purchase.purchase_date,

            transaction_type="Expense",

            category="Purchase",

            payment_mode=purchase.payment_mode,

            description=(
                f"Purchase for Job #{job.id} - "
                f"{purchase.product.name}"
            ),

            amount=purchase.total,
        )
# ============================================================
# JOB PAYMENT API
# ============================================================

class JobPaymentViewSet(viewsets.ModelViewSet):

    queryset = JobPayment.objects.select_related(
        "job",
        "job__branch",
        "job__customer",
    ).all().order_by(
        "-payment_date",
        "-id",
    )

    serializer_class = JobPaymentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            pass

        elif user.branch_id:

            queryset = queryset.filter(
                job__branch_id=user.branch_id
            )

        else:

            return queryset.none()

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        job = serializer.validated_data.get(
            "job"
        )

        amount = serializer.validated_data.get(
            "amount"
        )

        payment_type = serializer.validated_data.get(
            "payment_type"
        )

        # ---------------------------------------------
        # JOB REQUIRED
        # ---------------------------------------------

        if not job:

            raise serializers.ValidationError({
                "job":
                "Production job is required."
            })

        # ---------------------------------------------
        # BRANCH SECURITY
        # ---------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if job.branch_id != user.branch_id:

                raise PermissionDenied(
                    "You cannot add payment "
                    "to another branch's job."
                )

        # ---------------------------------------------
        # PAYMENT VALIDATION
        # ---------------------------------------------

        if amount <= 0:

            raise serializers.ValidationError({
                "amount":
                "Payment amount must be greater than zero."
            })

        # ---------------------------------------------
        # CHECK TOTAL
        # ---------------------------------------------

        current_received = sum(
            payment.amount
            for payment in job.payments.all()
        )

        if (
            current_received + amount
            > job.total_amount
        ):

            raise serializers.ValidationError({
                "amount":
                "Payment cannot exceed "
                "the remaining balance."
            })

        # ---------------------------------------------
        # CREATE PAYMENT
        # ---------------------------------------------

        payment = serializer.save()

        # ---------------------------------------------
        # UPDATE JOB PAYMENT TOTAL
        # ---------------------------------------------

        if payment.payment_type == "Advance":

            job.advance += payment.amount

        job.save()

        # ---------------------------------------------
        # DAY BOOK
        # ---------------------------------------------

        category = payment.payment_type

        DayBook.objects.create(

            branch=job.branch,

            date=payment.payment_date,

            transaction_type="Income",

            category=category,

            payment_mode=payment.payment_mode,

            description=(
                f"{payment.payment_type} "
                f"for Job #{job.id}"
            ),

            amount=payment.amount,
        )